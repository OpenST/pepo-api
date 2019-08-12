const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
  UserMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  ImageByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/ImageByIds'),
  VideoByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoByIds'),
  NotificationResponseHelper = require(rootPrefix + '/lib/notification/response/Helper'),
  TokenUserByUserIdsMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
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

    await Promise.all(promisesArray);

    const promisesArray2 = [];
    promisesArray2.push(oThis._fetchImages());

    await Promise.all(promisesArray2);

    await oThis._formatUserNotifications();

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
      const flattenedUserNotification = NotificationResponseHelper.getFlattenedObject(userNotification);
      const formattedUserNotification = {};

      formattedUserNotification.id = NotificationResponseHelper.getEncryptIdForNotification(flattenedUserNotification);

      formattedUserNotification.kind = userNotification.kind;
      formattedUserNotification.timestamp = userNotification.lastActionTimestamp;

      formattedUserNotification.heading = await oThis._getHeading(flattenedUserNotification);

      formattedUserNotification.goto = await oThis._getGoto(flattenedUserNotification);

      formattedUserNotification.imageId = await oThis._getImageId(flattenedUserNotification);

      formattedUserNotification.payload = await oThis._getPayload(flattenedUserNotification);

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
    const payload = {};

    const payloadArr = NotificationResponseHelper.payloadNotificationConfigForKind(userNotification.kind);

    for (let index = 0; index < payloadArr.length; index++) {
      const payloadKey = payloadArr[index];
      payload[payloadKey] = userNotification[payloadKey];
    }

    return payload;
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
      const key = keysForUserId[index];
      const val = userNotification[key];

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
    let vIds = [];

    const keysForVideoId = supportingEntitiesConfig.userIds;

    for (let index = 0; index < keysForVideoId.length; index++) {
      const key = keysForVideoId[index];
      const val = userNotification[key];

      if (Array.isArray(val)) {
        vIds = vIds.concat(val);
      } else {
        vIds.push(Number(val));
      }
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
