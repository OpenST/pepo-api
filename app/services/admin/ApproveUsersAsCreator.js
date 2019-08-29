/**
 * Module to approve users by admin
 *
 * @module app/services/admin/ApproveUsers
 */
const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserModelKlass = require(rootPrefix + '/app/models/mysql/User'),
  UsersCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  UserProfileElementsByUserIdCache = require(rootPrefix + '/lib/cacheManagement/multi/UserProfileElementsByUserIds'),
  userProfileElementConst = require(rootPrefix + '/lib/globalConstant/userProfileElement'),
  VideoAddNotification = require(rootPrefix + '/lib/userNotificationPublisher/VideoAdd'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  FeedModel = require(rootPrefix + '/app/models/mysql/Feed'),
  feedsConstants = require(rootPrefix + '/lib/globalConstant/feed'),
  ActivityLogModel = require(rootPrefix + '/app/models/mysql/AdminActivityLog'),
  adminActivityLogConst = require(rootPrefix + '/lib/globalConstant/adminActivityLogs'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user');

/**
 * Class to approve users by admin
 *
 * @class
 */
class ApproveUsersAsCreator extends ServiceBase {
  /**
   * Constructor to approve users by admin
   *
   * @param params
   * @param {Array} params.user_ids: User ids to be approved by admin.
   * @param {Array} params.current_admin: current admin.
   */
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.userIds = params.user_ids;
    oThis.currentAdmin = params.current_admin;
    oThis.currentAdminId = oThis.currentAdmin.id;

    oThis.userObjects = {};
  }

  /**
   * Main performer
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
   * Fetch users
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

    for (let userId in cacheRsp.data) {
      let userObj = cacheRsp.data[userId];

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
   * Approve users
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
   * Flush all users cache
   *
   * @returns {Promise<void>}
   * @private
   */
  async _flushCache() {
    const oThis = this;

    let promises = [];
    for (let userId in oThis.userObjects) {
      promises.push(UserModelKlass.flushCache(oThis.userObjects[userId]));
    }
    await Promise.all(promises);
  }

  /**
   * Publish Fan video if any of approved users
   *
   * @returns {Promise<void>}
   * @private
   */
  async _publishFanVideo() {
    const oThis = this;

    const userProfileElementsByUserIdCacheObj = new UserProfileElementsByUserIdCache({
        usersIds: oThis.userIds
      }),
      cacheRsp = await userProfileElementsByUserIdCacheObj.fetch();

    if (cacheRsp.isFailure()) {
      return;
    }

    let promises = [];
    for (let userId in oThis.userObjects) {
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
   * Add feed entry for user video
   *
   * @param videoId
   * @param userId
   * @returns {Promise<any>}
   * @private
   */
  async _addFeed(videoId, userId) {
    const oThis = this;

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
   * Log admin activity
   *
   * @return {Promise<void>}
   * @private
   */
  async _logAdminActivity() {
    const oThis = this;

    let activityLogObj = new ActivityLogModel({});

    for (let userId in oThis.userObjects) {
      await activityLogObj.insertAction({
        adminId: oThis.currentAdminId,
        actionOn: userId,
        action: adminActivityLogConst.approvedAsCreator
      });
    }
  }
}

module.exports = ApproveUsersAsCreator;
