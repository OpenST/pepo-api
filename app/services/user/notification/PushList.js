const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
  UserMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  ImageByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/ImageByIds'),
  VideoByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoByIds'),
  NotificationResponseHelper = require(rootPrefix + '/lib/notification/response/Helper'),
  UserNotificationServiceBase = require(rootPrefix + '/app/services/user/notification/Base'),
  TokenUserByUserIdsMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey');

/**
 * Class for push notification.
 *
 * @class PushNotification
 */
class PushNotification extends UserNotificationServiceBase {
  /**
   * Constructor for push contribution.
   *
   * @param {object} params
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);
    const oThis = this;

    oThis.notificationHookPayloads = params.notificationHookPayloads;

    oThis.userIds = [];
    oThis.amount = null;

    oThis.usersByIdMap = {};
    oThis.tokenUsersByUserIdMap = {};
    oThis.videoMap = {};
    oThis.imageMap = {};

    oThis.formattedNotifications = [];
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

    await oThis._setUserAndAmount();

    const promisesArray = [];

    promisesArray.push(oThis._fetchUsers());
    promisesArray.push(oThis._fetchTokenUsers());

    await Promise.all(promisesArray);

    await oThis._formatNotifications();

    return responseHelper.successWithData(oThis._finalResponse());
  }

  /**
   * Validate and sanitize specific params.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateAndSanitizeParams() {
    // Do nothing.
  }

  /**
   * Format notificationHookPayloads.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _formatNotifications() {
    const oThis = this;

    for (let index = 0; index < oThis.notificationHookPayloads.length; index++) {
      const pushNotification = oThis.notificationHookPayloads[index];
      const formattedPushNotification = {};

      let goto = await oThis._getGoto(pushNotification),
        heading = await oThis._getHeading(pushNotification);

      formattedPushNotification.notification = {
        title: 'New notification from Pepo',
        body: heading.title //JSON.stringify(heading.body)
      };

      formattedPushNotification.apns = {
        payload: {
          aps: {
            'mutable-content': 1,
            badge: 1
          }
        },
        fcm_options: {}
      };

      formattedPushNotification.android = {
        // // collapse_key: 'abc',
        notification: {
          //tag: 'unique tray2',
          // // notification_count: 2
        }
      };

      formattedPushNotification.data = { goto: JSON.stringify(goto) };

      oThis.formattedNotifications.push(formattedPushNotification);
    }
  }

  /**
   * Get image id for notificationHookPayloads.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _getImageId(pushNotification) {
    const oThis = this;

    const params = {
      supportingEntities: {
        [responseEntityKey.users]: oThis.usersByIdMap
      },
      userNotification: pushNotification,
      notificationType: oThis._notificationType
    };

    const resp = NotificationResponseHelper.getImageIdForNotification(params);

    if (resp.isFailure()) {
      return Promise.reject(resp);
    }

    return resp.data.imageId;
  }

  /**
   * Set heading for notificationHookPayloads.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _getHeading(userNotification) {
    const oThis = this;

    const params = {
      supportingEntities: {
        [responseEntityKey.users]: oThis.usersByIdMap,
        payload: { amount: oThis.amount }
      },
      userNotification: userNotification,
      notificationType: oThis._notificationType
    };

    const resp = NotificationResponseHelper.getHeadingForPushNotification(params);

    if (resp.isFailure()) {
      return Promise.reject(resp);
    }

    return resp.data.heading;
  }

  /**
   * Set goto for notificationHookPayloads
   *
   * @returns {Promise<never>}
   * @private
   */
  async _getGoto(userNotification) {
    const oThis = this;

    const resp = NotificationResponseHelper.getGotoForNotification({
      userNotification: userNotification,
      notificationType: oThis._notificationType
    });

    if (resp.isFailure()) {
      return Promise.reject(resp);
    }

    return resp.data;
  }

  /**
   * Find user ids in the notificationHookPayloads.
   *
   * @sets oThis.userIds, oThis.videoIds
   *
   * @returns {Promise<void>}
   * @private
   */
  async _setUserAndAmount() {
    const oThis = this;

    for (let index = 0; index < oThis.notificationHookPayloads.length; index++) {
      const userNotification = oThis.notificationHookPayloads[index];

      const supportingEntitiesConfig = NotificationResponseHelper.getSupportingEntitiesConfigForKind(
        userNotification.kind,
        oThis._notificationType
      );

      oThis.userIds = oThis.userIds.concat(
        oThis._getUserIdsForNotifications(userNotification, supportingEntitiesConfig)
      );

      oThis.amount = oThis._getAmountForNotification(userNotification, supportingEntitiesConfig);
    }

    oThis.userIds = [...new Set(oThis.userIds)];
  }

  /**
   * Notification type for notification config
   *
   * @returns {string}
   * @private
   */
  get _notificationType() {
    return 'pushNotification';
  }

  /**
   * Get  User Ids of supporting entity for a notificationHookPayloads
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
   * Get amount for notification.
   *
   * @param userNotification
   * @param supportingEntitiesConfig
   * @returns {*}
   * @private
   */
  _getAmountForNotification(userNotification, supportingEntitiesConfig) {
    let val;

    const keysForAmount = supportingEntitiesConfig.amount;

    for (let index = 0; index < keysForAmount.length; index++) {
      const dataKeys = keysForAmount[index];

      val = NotificationResponseHelper.getKeyDataFromNotification(userNotification, dataKeys);
    }

    return val;
  }

  /**
   * Get  Video Ids of supporting entity for a notificationHookPayloads
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
      formattedNotifications: oThis.formattedNotifications,
      usersByIdMap: userHash,
      tokenUsersByUserIdMap: tokenUserHash,
      imageMap: oThis.imageMap,
      videoMap: oThis.videoMap
    };
  }
}

module.exports = PushNotification;
