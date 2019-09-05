const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  FeedModel = require(rootPrefix + '/app/models/mysql/Feed'),
  UserModelKlass = require(rootPrefix + '/app/models/mysql/User'),
  UsersCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  ActivityLogModel = require(rootPrefix + '/app/models/mysql/AdminActivityLog'),
  VideoAddNotification = require(rootPrefix + '/lib/userNotificationPublisher/VideoAdd'),
  UserProfileElementsByUserIdCache = require(rootPrefix + '/lib/cacheManagement/multi/UserProfileElementsByUserIds'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  feedsConstants = require(rootPrefix + '/lib/globalConstant/feed'),
  adminActivityLogConst = require(rootPrefix + '/lib/globalConstant/adminActivityLogs'),
  userProfileElementConst = require(rootPrefix + '/lib/globalConstant/userProfileElement');

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

    const userMultiCache = new UsersCache({ ids: oThis.userIds });
    const cacheRsp = await userMultiCache.fetch();

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

      if (UserModelKlass.isUserApprovedCreator(userObj)) {
        return Promise.reject(
          responseHelper.paramValidationError({
            internal_error_identifier: 'a_s_a_au_3',
            api_error_identifier: 'could_not_proceed',
            params_error_identifiers: ['user_already_approved'],
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
    const oThis = this,
      propertyVal = userConstants.invertedProperties[userConstants.isApprovedCreatorProperty];

    await new UserModelKlass()
      .update(['properties = properties | ?', propertyVal])
      .where({ id: oThis.userIds })
      .fire();
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
      promises.push(UserModelKlass.flushCache(oThis.userObjects[userId]));
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

    const cacheRsp = await new UserProfileElementsByUserIdCache({ usersIds: oThis.userIds }).fetch();
    if (cacheRsp.isFailure()) {
      return cacheRsp;
    }

    const promises = [];
    for (const userId in oThis.userObjects) {
      const profileElements = cacheRsp.data[userId];
      if (profileElements && profileElements[userProfileElementConst.coverVideoIdKind]) {
        const videoId = profileElements[userProfileElementConst.coverVideoIdKind].data;
        promises.push(oThis._addFeed(videoId, userId));
        promises.push(new VideoAddNotification({ userId: userId, videoId: videoId }).perform());
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
   * @return {Promise<void>}
   * @private
   */
  async _logAdminActivity() {
    const oThis = this;

    const activityLogObj = new ActivityLogModel({});

    for (const userId in oThis.userObjects) {
      await activityLogObj.insertAction({
        adminId: oThis.currentAdminId,
        actionOn: userId,
        action: adminActivityLogConst.approvedAsCreator
      });
    }
  }
}

module.exports = ApproveUsersAsCreator;
