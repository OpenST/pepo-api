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
 * Class for push notification.
 *
 * @class PushNotification
 */
class PushNotification {
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
    const oThis = this;

    oThis.notificationHookPayloads = params.notificationHookPayloads;

    oThis.userIds = [];
    oThis.videoIds = [];
    oThis.imageIds = [];

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

    await oThis._setUserAndVideoIds();

    const promisesArray = [];

    promisesArray.push(oThis._fetchUsers());
    promisesArray.push(oThis._fetchTokenUsers());
    promisesArray.push(oThis._fetchVideos());
    // Images are fetched later because video covers also needs to be fetched.

    await Promise.all(promisesArray);

    await oThis._fetchImages();

    await oThis._formatnotifications();

    return responseHelper.successWithData(oThis._finalResponse());
  }

  /**
   * Validate and sanitize specific params.
   *
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
  async _formatnotifications() {
    const oThis = this;

    for (let index = 0; index < oThis.notificationHookPayloads.length; index++) {
      const pushNotification = oThis.notificationHookPayloads[index];
      const formattedPushNotification = {};
      let imageId = await oThis._getImageId(pushNotification);

      //todo: select resolution
      let image = oThis.imageMap[imageId] || null;

      let goto = await oThis._getGoto(pushNotification);
      formattedPushNotification.data = JSON.stringify({ goto: goto });

      let heading = await oThis._getHeading(pushNotification);
      formattedPushNotification.notification = {
        title: heading.title,
        body: heading.body,
        image: image
      };

      formattedPushNotification.apns = {
        payload: {
          aps: {
            'mutable-content': 1,
            badge: 1
          }
        },
        fcm_options: {
          image: image
        }
      };

      formattedPushNotification.android = {
        collapse_key: 'abc',
        notification: {
          tag: 'unique tray2',
          notification_count: 1
        }
      };

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
      userNotification: userNotification,
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
        [responseEntityKey.users]: oThis.usersByIdMap
      },
      userNotification: userNotification,
      notificationType: oThis._notificationType
    };
    //todo: use a different heading for push notification
    const resp = NotificationResponseHelper.getHeadingForNotification(params);

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
  async _setUserAndVideoIds() {
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

      oThis.videoIds = oThis.videoIds.concat(
        oThis._getVideoIdsForNotifications(userNotification, supportingEntitiesConfig)
      );
    }

    oThis.userIds = [...new Set(oThis.userIds)];
    oThis.videoIds = [...new Set(oThis.videoIds)];
  }

  /**
   * notification type for notification config
   *
   * @returns {Promise<void>}
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
      usersByIdMap: userHash,
      tokenUsersByUserIdMap: tokenUserHash,
      imageMap: oThis.imageMap,
      videoMap: oThis.videoMap
    };
  }
}

module.exports = PushNotification;
