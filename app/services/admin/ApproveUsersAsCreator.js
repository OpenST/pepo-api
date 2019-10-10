const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  FeedModel = require(rootPrefix + '/app/models/mysql/Feed'),
  VideoDetailModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  UsersCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  InviteCodeModel = require(rootPrefix + '/app/models/mysql/InviteCode'),
  inviteCodeConstants = require(rootPrefix + '/lib/globalConstant/inviteCode'),
  ActivityLogModel = require(rootPrefix + '/app/models/mysql/AdminActivityLog'),
  InviteCodeByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/InviteCodeByUserIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  feedsConstants = require(rootPrefix + '/lib/globalConstant/feed'),
  notificationJobEnqueue = require(rootPrefix + '/lib/rabbitMqEnqueue/notification'),
  notificationJobConstants = require(rootPrefix + '/lib/globalConstant/notificationJob'),
  adminActivityLogConstants = require(rootPrefix + '/lib/globalConstant/adminActivityLogs');

/**
 * Class to approve users by admin.
 *
 * @class ApproveUsersAsCreator
 */
class ApproveUsersAsCreator extends ServiceBase {
  /**
   * Constructor to approve users by admin.
   *
   * @param {object} params
   * @param {array} params.user_ids: User ids to be approved by admin.
   * @param {object} params.current_admin: current admin.
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.userIds = params.user_ids;
    oThis.currentAdmin = params.current_admin;
    oThis.currentAdminId = params.current_admin.id;

    oThis.userObjects = {};
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchUsers();

    await oThis._approveUsers();

    await oThis._markInviteLimitAsInfinite();

    await oThis._flushCache();

    await oThis._publishFanVideo();

    await oThis._logAdminActivity();

    return responseHelper.successWithData({});
  }

  /**
   * Fetch users.
   *
   * @sets oThis.userObjects
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchUsers() {
    const oThis = this;

    const cacheRsp = await new UsersCache({ ids: oThis.userIds }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_a_au_1',
          api_error_identifier: 'invalid_params',
          params_error_identifiers: ['invalid_user_id'],
          debug_options: {}
        })
      );
    }

    for (const userId in cacheRsp.data) {
      const userObj = cacheRsp.data[userId];

      if (userObj.status !== userConstants.activeStatus) {
        return Promise.reject(
          responseHelper.paramValidationError({
            internal_error_identifier: 'a_s_a_au_2',
            api_error_identifier: 'could_not_proceed',
            params_error_identifiers: ['user_inactive'],
            debug_options: {}
          })
        );
      }

      if (UserModel.isUserApprovedCreator(userObj)) {
        return Promise.reject(
          responseHelper.paramValidationError({
            internal_error_identifier: 'a_s_a_au_3',
            api_error_identifier: 'could_not_proceed',
            params_error_identifiers: ['user_already_approved'],
            debug_options: {}
          })
        );
      }

      if (UserModel.isUserDeniedCreator(userObj)) {
        return Promise.reject(
          responseHelper.paramValidationError({
            internal_error_identifier: 'a_s_a_au_4',
            api_error_identifier: 'could_not_proceed',
            params_error_identifiers: ['user_already_denied_as_creator'],
            debug_options: {}
          })
        );
      }

      oThis.userObjects[userId] = userObj;
    }
  }

  /**
   * Approve users.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _approveUsers() {
    const oThis = this;

    const propertyVal = userConstants.invertedProperties[userConstants.isApprovedCreatorProperty];

    await new UserModel()
      .update(['properties = properties | ?', propertyVal])
      .where({ id: oThis.userIds })
      .fire();
  }

  /**
   * Mark invite limit as infinite
   *
   * @returns {Promise<*>}
   * @private
   */
  async _markInviteLimitAsInfinite() {
    const oThis = this;

    for (const userId in oThis.userObjects) {
      const inviteCodeByUserIdCacheResponse = await new InviteCodeByUserIdsCache({
        userIds: [userId]
      }).fetch();

      if (inviteCodeByUserIdCacheResponse.isFailure()) {
        return Promise.reject(inviteCodeByUserIdCacheResponse);
      }

      const inviteCodeObj = inviteCodeByUserIdCacheResponse.data[userId];

      const queryResponse = await new InviteCodeModel()
        .update({
          invite_limit: inviteCodeConstants.infiniteInviteLimit
        })
        .where({ user_id: userId })
        .fire();

      if (queryResponse.affectedRows === 1) {
        logger.info(`User with ${userId} has now infinite invites`);

        await InviteCodeModel.flushCache(inviteCodeObj);
      } else {
        return responseHelper.error({
          internal_error_identifier: 'a_s_auac_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { userId: userId }
        });
      }
    }

    return responseHelper.successWithData({});
  }

  /**
   * Flush all users cache.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _flushCache() {
    const oThis = this;

    const promises = [];
    for (const userId in oThis.userObjects) {
      promises.push(UserModel.flushCache(oThis.userObjects[userId]));
    }
    await Promise.all(promises);
  }

  /**
   * Publish fan video if any of approved users.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _publishFanVideo() {
    const oThis = this;

    const promises = [];
    const dbRows = await new VideoDetailModel().fetchLatestVideoId(oThis.userIds);

    for (let ind = 0; ind < oThis.userIds.length; ind++) {
      const userId = oThis.userIds[ind];
      const latestVideoId = dbRows[userId].latestVideoId;

      if (latestVideoId) {
        promises.push(oThis._addFeed(latestVideoId, userId));
        promises.push(
          notificationJobEnqueue.enqueue(notificationJobConstants.videoAdd, {
            userId: userId,
            videoId: latestVideoId
          })
        );
      }
    }

    await Promise.all(promises);
  }

  /**
   * Add feed entry for user video.
   *
   * @param {number} videoId
   * @param {number} userId
   *
   * @returns {Promise<any>}
   * @private
   */
  async _addFeed(videoId, userId) {
    return new FeedModel()
      .insert({
        primary_external_entity_id: videoId,
        kind: feedsConstants.invertedKinds[feedsConstants.fanUpdateKind],
        actor: userId,
        pagination_identifier: Math.round(new Date() / 1000)
      })
      .fire();
  }

  /**
   * Log admin activity.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _logAdminActivity() {
    const oThis = this;

    const activityLogObj = new ActivityLogModel({});

    for (const userId in oThis.userObjects) {
      await activityLogObj.insertAction({
        adminId: oThis.currentAdminId,
        actionOn: userId,
        action: adminActivityLogConstants.approvedAsCreator
      });
    }
  }
}

module.exports = ApproveUsersAsCreator;
