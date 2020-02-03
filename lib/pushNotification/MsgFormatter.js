const rootPrefix = '../..',
  UserMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  NotificationResponseHelper = require(rootPrefix + '/lib/notification/response/Helper'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  TokenUserByUserIdsMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  notificationHookConstants = require(rootPrefix + '/lib/globalConstant/notificationHook'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey');

/**
 * Class for push notification message formatter.
 *
 * @class MsgFormatter
 */
class MsgFormatter {
  /**
   * PushNotifications Constructor.
   *
   * @param params
   */
  constructor(params) {
    const oThis = this;

    oThis.notificationHookPayload = params.notificationHookPayload;
    oThis.notificationHookPayload.kind = params.kind;

    oThis.userIds = [];
    oThis.channelIds = [];

    oThis.payload = null;
    oThis.heading = null;
    oThis.goto = null;

    oThis.usersByIdMap = {};
    oThis.channelsByIdMap = {};
    oThis.tokenUsersByUserIdMap = {};
  }

  /**
   * Perform.
   *
   * @returns {Promise<void>}
   * @private
   */
  async perform() {
    const oThis = this,
      promiseArray1 = [];

    promiseArray1.push(oThis._setUsers());
    promiseArray1.push(oThis._setChannelIds());

    await Promise.all(promiseArray1);

    const promisesArray = [];

    promisesArray.push(oThis._fetchUsers());
    promisesArray.push(oThis._fetchChannels());
    promisesArray.push(oThis._fetchTokenUsers());

    promisesArray.push(oThis._setPayload());
    promisesArray.push(oThis._setGoto());

    await Promise.all(promisesArray);

    await oThis._getHeading();

    return responseHelper.successWithData(oThis._prepareResponse());
  }

  /**
   * Find user ids in the notificationHookPayloads.
   *
   * @sets oThis.userIds
   *
   * @returns {Promise<void>}
   * @private
   */
  async _setUsers() {
    const oThis = this;

    const supportingEntitiesConfig = NotificationResponseHelper.getSupportingEntitiesConfigForKind(
      oThis.notificationHookPayload.kind,
      oThis._notificationType
    );

    oThis.userIds = oThis.userIds.concat(oThis._getUserIdsForNotifications(supportingEntitiesConfig));
    oThis.userIds = [...new Set(oThis.userIds)];

    logger.log('oThis.userIds====', oThis.userIds);
  }

  /**
   * Find channel ids in the notificationHookPayloads.
   *
   * @sets oThis.channelIds
   *
   * @returns {Promise<void>}
   * @private
   */
  async _setChannelIds() {
    const oThis = this;

    const supportingEntitiesConfig = NotificationResponseHelper.getSupportingEntitiesConfigForKind(
      oThis.notificationHookPayload.kind,
      oThis._notificationType
    );

    oThis.channelIds = oThis.channelIds.concat(oThis._getChannelIdsForNotifications(supportingEntitiesConfig));
    oThis.channelIds = [...new Set(oThis.channelIds)];

    logger.log('oThis.channelIds====', oThis.channelIds);
  }

  /**
   * Set heading for notificationHookPayloads.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _getHeading() {
    const oThis = this;

    const params = {
      supportingEntities: {
        [responseEntityKey.users]: oThis.usersByIdMap,
        [responseEntityKey.channels]: oThis.channelsByIdMap
      },
      userNotification: oThis.notificationHookPayload,
      notificationType: oThis._notificationType,
      payload: oThis.payload
    };

    const resp = NotificationResponseHelper.getHeadingForNotification(params);

    if (resp.isFailure()) {
      return Promise.reject(resp);
    }

    oThis.heading = resp.data.heading;
  }

  /**
   * Set payload for notificationHookPayloads
   *
   * @returns {Promise<never>}
   * @private
   */
  async _setPayload() {
    const oThis = this;

    const resp = NotificationResponseHelper.getPayloadDataForNotification({
      userNotification: oThis.notificationHookPayload,
      notificationType: oThis._notificationType
    });

    if (resp.isFailure()) {
      return Promise.reject(resp);
    }

    oThis.payload = resp.data.payload;

    logger.log('oThis.goto =======', oThis.goto);
  }

  /**
   * Set goto for notificationHookPayloads
   *
   * @returns {Promise<never>}
   * @private
   */
  async _setGoto() {
    const oThis = this;

    const resp = NotificationResponseHelper.getGotoForNotification({
      userNotification: oThis.notificationHookPayload,
      notificationType: oThis._notificationType
    });

    if (resp.isFailure()) {
      return Promise.reject(resp);
    }

    oThis.goto = resp.data;

    logger.log('oThis.goto =======', oThis.goto);
  }

  /**
   * Get  User Ids of supporting entity for a notificationHookPayloads.
   *
   * @param supportingEntitiesConfig
   * @returns {Array}
   * @private
   */
  _getUserIdsForNotifications(supportingEntitiesConfig) {
    const oThis = this;

    let uIds = [];

    const keysForUserId = supportingEntitiesConfig.userIds;

    for (let index = 0; index < keysForUserId.length; index++) {
      const dataKeys = keysForUserId[index];

      const val = NotificationResponseHelper.getKeyDataFromNotification(oThis.notificationHookPayload, dataKeys);

      if (Array.isArray(val)) {
        uIds = uIds.concat(val);
      } else {
        uIds.push(Number(val));
      }
    }

    return uIds;
  }

  /**
   * Get Channel Ids of supporting entity for a notificationHookPayloads.
   *
   * @param supportingEntitiesConfig
   * @returns {Array}
   * @private
   */
  _getChannelIdsForNotifications(supportingEntitiesConfig) {
    const oThis = this;

    let chIds = [];
    if (supportingEntitiesConfig.channelIds) {
      const keysForChannelId = supportingEntitiesConfig.channelIds;

      for (let index = 0; index < keysForChannelId.length; index++) {
        const dataKeys = keysForChannelId[index];

        const val = NotificationResponseHelper.getKeyDataFromNotification(oThis.notificationHookPayload, dataKeys);

        if (val) {
          chIds.push(Number(val));
        }
      }
    }

    console.log('chIds ========', chIds);
    return chIds;
  }

  /**
   * Fetch users from cache.
   *
   * @sets oThis.usersByIdMap
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
  }

  /**
   * Fetch channels data.
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _fetchChannels() {
    const oThis = this;

    if (oThis.channelIds.length < 0) {
      return;
    }

    const channelByIdsCacheResp = await new ChannelByIdsCache({ ids: oThis.channelIds }).fetch();

    if (channelByIdsCacheResp.isFailure()) {
      return Promise.reject(channelByIdsCacheResp);
    }

    oThis.channelsByIdMap = channelByIdsCacheResp.data;
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
  }

  /**
   * Prepare Response.
   *
   * @private
   */
  _prepareResponse() {
    const oThis = this;

    const formattedMessagePayload = {};

    formattedMessagePayload.data = {
      goto: JSON.stringify(oThis.goto)
    };

    const textBody = oThis.heading.text
      .toString()
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');

    formattedMessagePayload.notification = {
      title: oThis.heading.title,
      body: textBody
    };

    formattedMessagePayload.apns = {
      payload: {
        aps: {
          'mutable-content': 1
        }
      },
      fcm_options: {}
    };

    formattedMessagePayload.android = {
      notification: {}
    };

    return {
      formattedPayload: formattedMessagePayload
    };
  }

  /**
   * Notification type for notification config
   *
   * @returns {string}
   * @private
   */
  get _notificationType() {
    return notificationHookConstants.pushNotificationType;
  }
}

module.exports = MsgFormatter;
