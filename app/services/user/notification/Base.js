const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
  UserMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  ImageByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/ImageByIds'),
  VideoByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoByIds'),
  TokenUserByUserIdsMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  NotificationResponseGet = require(rootPrefix + '/lib/notification/response/Get'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for user Notification Base.
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

    const promisesArray2 = [];
    promisesArray2.push(oThis._fetchImages());

    await Promise.all(promisesArray2);

    oThis._formatUserNotifications();
    //todo: update visitTime table. check if it will inser as well
    //send: last read time in response
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
   * format notifications
   *
   *
   * @returns {Promise<never>}
   * @private
   */
  _formatUserNotifications() {
    const oThis = this;

    for (let i = 0; i < oThis.userNotifications.length; i++) {
      let userNotification = oThis.userNotifications[i];
      let formattedUserNotification = {};

      formattedUserNotification['id'] = new NotificationResponseGet().getEncryptIdForNotification(userNotification);

      formattedUserNotification['kind'] = userNotification.kind;
      formattedUserNotification['timestamp'] = userNotification.timestamp;

      let headingData = oThis._getHeading(userNotification);
      formattedUserNotification['heading'] = headingData;

      let gotoData = oThis._getGoto(userNotification);
      formattedUserNotification['goto'] = gotoData;

      let imageId = oThis._getImageId(userNotification);
      formattedUserNotification['imageId'] = imageId;

      let payload = oThis._getPayload(userNotification);
      formattedUserNotification['payload'] = payload;

      oThis.formattedUserNotifications.push(formattedUserNotification);
    }
  }

  /**
   * Get ImageId for notifications
   *
   *
   * @returns {Promise<never>}
   * @private
   */
  _getImageId(userNotification) {
    const oThis = this;

    let params = {
      supportingEntities: {
        [responseEntityKey.users]: oThis.usersByIdMap
      },
      userNotification: userNotification
    };

    let resp = new NotificationResponseGet().getImageIdForNotification(params);

    if (resp.isFailure()) {
      return Promise.reject(resp);
    }

    return resp.data['imageId'];
  }

  /**
   * Set payload for notifications
   *
   *
   * @returns {Promise<never>}
   * @private
   */
  _getPayload(userNotification) {
    const oThis = this;
    const payload = {};

    let payloadArr = new NotificationResponseGet().payloadNotificationConfigForKind(userNotification.kind);

    for (let i = 0; i < payloadArr.length; i++) {
      const payloadKey = payloadArr[i];
      payload[payloadKey] = userNotification[payloadKey];
    }

    return payload;
  }

  /**
   * Set Heading for notifications
   *
   *
   * @returns {Promise<never>}
   * @private
   */
  _getHeading(userNotification) {
    const oThis = this;

    let params = {
      supportingEntities: {
        [responseEntityKey.users]: oThis.usersByIdMap
      },
      userNotification: userNotification
    };

    let resp = new NotificationResponseGet().getHeadingForNotification(params);

    if (resp.isFailure()) {
      return Promise.reject(resp);
    }

    return resp.data['heading'];
  }

  /**
   * Set Goto for notifications
   *
   *
   * @returns {Promise<never>}
   * @private
   */
  _getGoto(userNotification) {
    const oThis = this;

    let resp = new NotificationResponseGet().getGotoForNotification({ userNotification: userNotification });

    if (resp.isFailure()) {
      return Promise.reject(resp);
    }

    return resp.data['goto'];
  }

  /**
   * find user ids in the notifications.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _setUserAndVideoIds() {
    const oThis = this;

    for (let i = 0; i < oThis.userNotifications.length; i++) {
      const uN = oThis.userNotifications[i];

      let supportingEntitiesConfig = new NotificationResponseGet().getSupportingEntitiesConfigForKind({
        userNotification: userNotification
      });

      oThis.userIds = oThis.userIds.concat(oThis._getUserIdsForNotifications(uN, supportingEntitiesConfig));
      oThis.videoIds = oThis.videoIds.concat(oThis._getVideoIdsForNotifications(uN, supportingEntitiesConfig));
    }

    oThis.userIds = new Set(oThis.userIds);
    oThis.videoIds = new Set(oThis.videoIds);
  }

  /**
   * Get  User Ids of supporting entity for a notifications
   *
   * @returns {Promise<never>}
   * @private
   */
  _getUserIdsForNotifications(userNotification, supportingEntitiesConfig) {
    const oThis = this;
    let uIds = [];

    let keysForUserId = supportingEntitiesConfig.userIds;

    for (let i = 0; i < keysForUserId.length; i++) {
      let key = keysForUserId[i];
      let val = userNotification[key];

      if (Array.isArray(val)) {
        uIds = uIds.concat(val);
      } else {
        uIds.push(val);
      }
    }

    return uIds;
  }

  /**
   * Get  Video Ids of supporting entity for a notifications
   *
   * @returns {Promise<never>}
   * @private
   */
  _getVideoIdsForNotifications(userNotification, supportingEntitiesConfig) {
    const oThis = this;
    let vIds = [];

    let keysForVideoId = supportingEntitiesConfig.userIds;

    for (let i = 0; i < keysForVideoId.length; i++) {
      let key = keysForVideoId[i];
      let val = userNotification[key];

      if (Array.isArray(val)) {
        vIds = vIds.concat(val);
      } else {
        vIds.push(val);
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
      videoMap: oThis.videoMap,
      userNotificationList: oThis.formattedUserNotifications
    };
  }
}

module.exports = UserNotificationBase;
