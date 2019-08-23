const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
  UserMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  ImageByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/ImageByIds'),
  VideoByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoByIds'),
  NotificationResponseHelper = require(rootPrefix + '/lib/notification/response/Helper'),
  TokenUserByUserIdsMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  videoConstants = require(rootPrefix + '/lib/globalConstant/video'),
  userNotificationConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userNotification'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob'),
  UserNotificationModel = require(rootPrefix + '/app/models/cassandra/UserNotification'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey');

/**
 * Class for user notification base.
 *
 * @class UserNotification
 */
class UserNotificationBase extends ServiceBase {
  /**
   * Constructor for user contribution base.
   *
   * @param {object} params
   * @param {object} params.current_user
   * @param {number/string} params.current_user.id
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.userNotifications = [];
    oThis.userIds = [];
    oThis.videoIds = [];
    oThis.imageIds = [];

    oThis.usersByIdMap = {};
    oThis.tokenUsersByUserIdMap = {};
    oThis.videoMap = {};
    oThis.imageMap = {};

    oThis.formattedUserNotifications = [];
    oThis.notificationVideoMap = {};
    oThis.notificationsToDelete = [];
  }

  /**
   * Async perform.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    await oThis._setUserNotification();

    await oThis._setUserAndVideoIds();

    const promisesArray = [];

    promisesArray.push(oThis._fetchUsers());
    promisesArray.push(oThis._fetchTokenUsers());
    promisesArray.push(oThis._fetchVideos());
    // Images are fetched later because video covers also needs to be fetched.

    await Promise.all(promisesArray);

    await oThis._fetchImages();

    await oThis._formatUserNotifications();

    await oThis._enqueueBackgroundTasks();

    return responseHelper.successWithData(oThis._finalResponse());
  }

  /**
   * Fetch user notifications from cache.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _setUserNotification() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Validate and sanitize specific params.
   *
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateAndSanitizeParams() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Format notifications.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _formatUserNotifications() {
    const oThis = this;

    for (let index = 0; index < oThis.userNotifications.length; index++) {
      const userNotification = oThis.userNotifications[index];
      const formattedUserNotification = {};

      if (oThis._isNotificationBlocked(userNotification)) {
        continue;
      }

      formattedUserNotification.id = NotificationResponseHelper.getEncryptIdForNotification(userNotification);

      formattedUserNotification.kind = userNotification.kind;
      formattedUserNotification.timestamp = userNotification.lastActionTimestamp;

      formattedUserNotification.heading = await oThis._getHeading(userNotification);

      formattedUserNotification.goto = await oThis._getGoto(userNotification);

      formattedUserNotification.imageId = await oThis._getImageId(userNotification);

      formattedUserNotification.payload = await oThis._getPayload(userNotification);

      oThis.formattedUserNotifications.push(formattedUserNotification);
    }
  }

  /**
   * Get image id for notifications.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _getImageId(userNotification) {
    const oThis = this;

    const params = {
      supportingEntities: {
        [responseEntityKey.users]: oThis.usersByIdMap
      },
      userNotification: userNotification
    };

    const resp = NotificationResponseHelper.getImageIdForNotification(params);

    if (resp.isFailure()) {
      return Promise.reject(resp);
    }

    return resp.data.imageId;
  }

  /**
   * Set payload for notifications.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _getPayload(userNotification) {
    const oThis = this;

    const resp = NotificationResponseHelper.getPayloadDataForNotification({ userNotification: userNotification });

    if (resp.isFailure()) {
      return Promise.reject(resp);
    }

    return resp.data.payload;
  }

  /**
   * Set heading for notifications.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _getHeading(userNotification) {
    const oThis = this;

    const params = {
      supportingEntities: {
        [responseEntityKey.users]: oThis.usersByIdMap
      },
      userNotification: userNotification
    };

    const resp = NotificationResponseHelper.getHeadingForNotification(params);

    if (resp.isFailure()) {
      return Promise.reject(resp);
    }

    return resp.data.heading;
  }

  /**
   * Set goto for notifications
   *
   * @returns {Promise<never>}
   * @private
   */
  async _getGoto(userNotification) {
    const resp = NotificationResponseHelper.getGotoForNotification({ userNotification: userNotification });

    if (resp.isFailure()) {
      return Promise.reject(resp);
    }

    return resp.data;
  }

  /**
   * Find user ids in the notifications.
   *
   * @sets oThis.userIds, oThis.videoIds
   *
   * @returns {Promise<void>}
   * @private
   */
  async _setUserAndVideoIds() {
    const oThis = this;

    for (let index = 0; index < oThis.userNotifications.length; index++) {
      const userNotification = NotificationResponseHelper.getFlattenedObject(oThis.userNotifications[index]);

      const supportingEntitiesConfig = NotificationResponseHelper.getSupportingEntitiesConfigForKind(
        userNotification.kind
      );

      oThis.userIds = oThis.userIds.concat(
        oThis._getUserIdsForNotifications(userNotification, supportingEntitiesConfig)
      );

      oThis.videoIds = oThis.videoIds.concat(
        oThis._getVideoIdsForNotifications(userNotification, supportingEntitiesConfig)
      );
    }

    oThis.userIds = [...new Set(oThis.userIds)];
    oThis.videoIds = [...new Set(oThis.videoIds)];
  }

  /**
   * Get  User Ids of supporting entity for a notifications
   *
   * @returns {Promise<array>}
   * @private
   */
  _getUserIdsForNotifications(userNotification, supportingEntitiesConfig) {
    let uIds = [];

    const keysForUserId = supportingEntitiesConfig.userIds;

    for (let index = 0; index < keysForUserId.length; index++) {
      const dataKeys = keysForUserId[index];

      const val = NotificationResponseHelper.getKeyDataFromNotification(userNotification, dataKeys);

      if (Array.isArray(val)) {
        uIds = uIds.concat(val);
      } else {
        uIds.push(Number(val));
      }
    }

    return uIds;
  }

  /**
   * Get  Video Ids of supporting entity for a notifications
   *
   * @returns {Promise<array>}
   * @private
   */
  _getVideoIdsForNotifications(userNotification, supportingEntitiesConfig) {
    const oThis = this;

    let vIds = [];

    const keysForVideoId = supportingEntitiesConfig.videoIds;

    for (let index = 0; index < keysForVideoId.length; index++) {
      const dataKeys = keysForVideoId[index];

      const val = NotificationResponseHelper.getKeyDataFromNotification(userNotification, dataKeys);

      if (Array.isArray(val)) {
        vIds = vIds.concat(val);
      } else {
        vIds.push(Number(val));
      }
    }

    if (vIds.length > 0) {
      oThis.notificationVideoMap[userNotification.uuid] = vIds;
    }

    return vIds;
  }

  /**
   * Fetch users from cache.
   *
   * @sets oThis.usersByIdMap, oThis.imageIds
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchUsers() {
    const oThis = this;

    if (oThis.userIds.length < 1) {
      return responseHelper.successWithData({});
    }

    const usersByIdHashRes = await new UserMultiCache({ ids: oThis.userIds }).fetch();

    if (usersByIdHashRes.isFailure()) {
      return Promise.reject(usersByIdHashRes);
    }

    oThis.usersByIdMap = usersByIdHashRes.data;

    for (const id in oThis.usersByIdMap) {
      const userObj = oThis.usersByIdMap[id];
      if (userObj.profileImageId) {
        oThis.imageIds.push(userObj.profileImageId);
      }
    }

    return responseHelper.successWithData({});
  }

  /**
   * Fetch token user details from cache.
   *
   * @sets oThis.tokenUsersByUserIdMap
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchTokenUsers() {
    const oThis = this;

    if (oThis.userIds.length < 1) {
      return responseHelper.successWithData({});
    }

    const tokenUsersByIdHashRes = await new TokenUserByUserIdsMultiCache({
      userIds: oThis.userIds
    }).fetch();

    if (tokenUsersByIdHashRes.isFailure()) {
      return Promise.reject(tokenUsersByIdHashRes);
    }

    oThis.tokenUsersByUserIdMap = tokenUsersByIdHashRes.data;

    return responseHelper.successWithData({});
  }

  /**
   * Fetch videos.
   *
   * @sets oThis.videoMap
   *
   * @return {Promise<*>}
   * @private
   */
  async _fetchVideos() {
    const oThis = this;

    if (oThis.videoIds.length < 1) {
      return;
    }

    const cacheRsp = await new VideoByIdCache({ ids: oThis.videoIds }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    oThis.videoMap = cacheRsp.data;

    for (const videoId in oThis.videoMap) {
      const video = oThis.videoMap[videoId],
        posterImageId = video.posterImageId;
      if (posterImageId) {
        oThis.imageIds.push(posterImageId);
      }
    }
  }

  /**
   * Fetch images.
   *
   * @sets oThis.imageMap
   *
   * @return {Promise<*>}
   * @private
   */
  async _fetchImages() {
    const oThis = this;

    if (oThis.imageIds.length < 1) {
      return;
    }

    const cacheRsp = await new ImageByIdCache({ ids: oThis.imageIds }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    oThis.imageMap = cacheRsp.data;
  }

  /**
   * Check whether notification can be sent out or its blocked, due to some deleted entity
   *
   * @param userNotification
   * @returns {boolean}
   * @private
   */
  _isNotificationBlocked(userNotification) {
    const oThis = this;

    // For now only video entity can be deleted
    // So if notification don't have videos then is allowed to be sent out
    if (oThis.notificationVideoMap[userNotification.uuid]) {
      for (let i = 0; i < oThis.notificationVideoMap[userNotification.uuid].length; i++) {
        let vid = oThis.notificationVideoMap[userNotification.uuid][i];
        // For now only delete notification of kind video add
        if (
          userNotification.kind == userNotificationConstants.videoAddKind &&
          oThis.videoMap[vid].status == videoConstants.deletedStatus
        ) {
          oThis.notificationsToDelete.push(userNotification);
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Enqueue background task
   *
   * @returns {Promise<void>}
   * @private
   */
  async _enqueueBackgroundTasks() {
    const oThis = this;

    console.log('Notifications To Delete: ', oThis.notificationsToDelete);

    if (oThis.notificationsToDelete.length > 0) {
      await bgJob.enqueue(bgJobConstants.deleteCassandraJobTopic, {
        tableName: new UserNotificationModel().tableName,
        elementsToDelete: oThis.notificationsToDelete
      });
    }
  }

  /**
   * Service response.
   *
   * @returns {object}
   * @private
   */
  _finalResponse() {
    const oThis = this;

    const userHash = {},
      tokenUserHash = {};

    for (let index = 0; index < oThis.userIds.length; index++) {
      const userId = oThis.userIds[index],
        user = oThis.usersByIdMap[userId],
        tokenUser = oThis.tokenUsersByUserIdMap[userId];
      userHash[userId] = new UserModel().safeFormattedData(user);
      tokenUserHash[userId] = new TokenUserModel().safeFormattedData(tokenUser);
    }

    return {
      usersByIdMap: userHash,
      tokenUsersByUserIdMap: tokenUserHash,
      imageMap: oThis.imageMap,
      videoMap: oThis.videoMap
    };
  }
}

module.exports = UserNotificationBase;
