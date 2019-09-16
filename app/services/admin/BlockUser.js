const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  FeedModel = require(rootPrefix + '/app/models/mysql/Feed'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  VideoModel = require(rootPrefix + '/app/models/mysql/Video'),
  UsersCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  VideoDetailModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  AdminActivityLogModel = require(rootPrefix + '/app/models/mysql/AdminActivityLog'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  feedConstants = require(rootPrefix + '/lib/globalConstant/feed'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  adminActivityLogConstants = require(rootPrefix + '/lib/globalConstant/adminActivityLogs');

/**
 * Class to block users by admin.
 *
 * @class BlockUser
 */
class BlockUser extends ServiceBase {
  /**
   * Constructor to block users by admin.
   *
   * @param {object} params
   * @param {array} params.user_ids: User ids to be blocked by admin.
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
    oThis.currentAdminId = params.current_admin.id;

    oThis.userObjects = {};
    oThis.userIdToVideoIds = {};
    oThis.videoIdsToBeDeleted = [];
  }

  /**
   * Async perform.
   *
   * @returns {Promise<result>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchUsers();

    await oThis._blockUsers();

    let promisesArray = [];
    promisesArray.push(oThis._flushCache(), oThis._logAdminActivity(), oThis._fetchVideoIdsForUsers());
    await Promise.all(promisesArray);

    promisesArray = [];
    promisesArray.push(oThis._markVideoDeleted(), oThis._markVideoDetailDeleted(), oThis._deleteVideoFeeds());
    await Promise.all(promisesArray);

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
          internal_error_identifier: 'a_s_a_du_1',
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
            internal_error_identifier: 'a_s_a_du_2',
            api_error_identifier: 'could_not_proceed',
            params_error_identifiers: ['user_inactive'],
            debug_options: {}
          })
        );
      }

      oThis.userObjects[userId] = userObj;
    }
  }

  /**
   * Block users.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _blockUsers() {
    const oThis = this;

    return new UserModel()
      .update({ status: userConstants.invertedStatuses[userConstants.inActiveStatus] })
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
      promises.push(UserModel.flushCache(oThis.userObjects[userId]));
    }

    await Promise.all(promises);
  }

  /**
   * Fetch video ids for users.
   *
   * @sets oThis.userIdToVideoIds, oThis.videoIdsToBeDeleted
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchVideoIdsForUsers() {
    const oThis = this;

    const promisesArray = [];

    for (let index = 0; index < oThis.userIds.length; index++) {
      // Fetch videoIds for user.
      promisesArray.push(
        new VideoDetailModel()
          .select('video_id')
          .where({ creator_user_id: oThis.userIds[index] })
          .fire()
      );
    }

    const promisesResponse = await Promise.all(promisesArray);

    for (let index = 0; index < oThis.userIds.length; index++) {
      const userId = oThis.userIds[index];
      const dbRows = promisesResponse[index];

      if (dbRows.length > 0) {
        oThis.userIdToVideoIds[userId] = [];
        for (let dbRowIndex = 0; dbRowIndex < dbRows.length; dbRowIndex++) {
          oThis.userIdToVideoIds[userId].push(dbRows[dbRowIndex].video_id);
          oThis.videoIdsToBeDeleted.push(dbRows[dbRowIndex].video_id);
        }
      }
    }
  }

  /**
   * Mark status in videos.
   *
   * @return {Promise<*>}
   * @private
   */
  async _markVideoDeleted() {
    const oThis = this;

    if (oThis.videoIdsToBeDeleted.length === 0) {
      return;
    }

    return new VideoModel().markVideosDeleted({ ids: oThis.videoIdsToBeDeleted });
  }

  /**
   * Delete from video details.
   *
   * @return {Promise<*>}
   * @private
   */
  async _markVideoDetailDeleted() {
    const oThis = this;

    const promisesArray = [];

    for (const userId in oThis.userIdToVideoIds) {
      for (let index = 0; index < oThis.userIdToVideoIds[userId].length; index++) {
        promisesArray.push(
          new VideoDetailModel().markDeleted({
            userId: userId,
            videoId: oThis.userIdToVideoIds[userId][index]
          })
        );
      }
    }

    await Promise.all(promisesArray);
  }

  /**
   * Delete video from feeds.
   *
   * @return {Promise<*>}
   * @private
   */
  async _deleteVideoFeeds() {
    const oThis = this;

    if (oThis.videoIdsToBeDeleted.length === 0) {
      return;
    }

    return new FeedModel()
      .delete()
      .where({
        kind: feedConstants.invertedKinds[feedConstants.fanUpdateKind],
        primary_external_entity_id: oThis.videoIdsToBeDeleted
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

    const promisesArray = [];

    for (const userId in oThis.userObjects) {
      promisesArray.push(
        new AdminActivityLogModel().insertAction({
          adminId: oThis.currentAdminId,
          actionOn: userId,
          action: adminActivityLogConstants.blockUser
        })
      );
    }

    await Promise.all(promisesArray);
  }
}

module.exports = BlockUser;
