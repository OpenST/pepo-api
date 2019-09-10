const rootPrefix = '../..',
  UserMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  TokenUserByUserIdsMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  UserNotificationsCountModel = require(rootPrefix + '/app/models/cassandra/UserNotificationsCount'),
  NotificationResponseHelper = require(rootPrefix + '/lib/notification/response/Helper'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
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

    oThis.userIds = [];
    oThis.amount = null;
    oThis.heading = null;
    oThis.goto = null;
    oThis.userIdToBadgeCountMap = {};

    oThis.usersByIdMap = {};
    oThis.tokenUsersByUserIdMap = {};
  }

  /**
   * Perform.
   *
   * @returns {Promise<void>}
   * @private
   */
  async perform() {
    const oThis = this;

    const promisesArray = [];

    promisesArray.push(oThis._getGoto());
    promisesArray.push(oThis._setUserAndAmount());
    promisesArray.push(oThis._fetchUsers());
    promisesArray.push(oThis._fetchTokenUsers());

    await Promise.all(promisesArray);

    if (oThis.userIds.length > 0) {
      await oThis._fetchBadgeCounts();
    }

    await oThis._getHeading();

    return responseHelper.successWithData(oThis._prepareResponse());
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
        payload: {
          amount: oThis.amount,
          thankYouText: oThis.thankYouText
        }
      },
      userNotification: oThis.notificationHookPayload,
      notificationType: oThis._notificationType
    };

    const resp = NotificationResponseHelper.getHeadingForPushNotification(params);

    if (resp.isFailure()) {
      return Promise.reject(resp);
    }

    oThis.heading = resp.data.heading;
  }

  /**
   * Set goto for notificationHookPayloads
   *
   * @returns {Promise<never>}
   * @private
   */
  async _getGoto() {
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
   * Find user ids in the notificationHookPayloads.
   *
   * @sets oThis.userIds, oThis.amount
   *
   * @returns {Promise<void>}
   * @private
   */
  async _setUserAndAmount() {
    const oThis = this;

    const supportingEntitiesConfig = NotificationResponseHelper.getSupportingEntitiesConfigForKind(
      oThis.notificationHookPayload.kind,
      oThis._notificationType
    );

    oThis.userIds = oThis.userIds.concat(oThis._getUserIdsForNotifications(supportingEntitiesConfig));
    oThis.userIds = [...new Set(oThis.userIds)];

    oThis._getAmountForNotification(supportingEntitiesConfig);

    oThis._getThankYouTextForNotification(supportingEntitiesConfig);

    logger.log('oThis.userIds====', oThis.userIds);
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
   * Get amount for notification.
   *
   * @param supportingEntitiesConfig
   * @returns {*}
   * @private
   */
  _getAmountForNotification(supportingEntitiesConfig) {
    const oThis = this;

    if (!supportingEntitiesConfig.amount) {
      return;
    }

    const dataKeysForAmount = supportingEntitiesConfig.amount;

    let amount = NotificationResponseHelper.getKeyDataFromNotification(
      oThis.notificationHookPayload,
      dataKeysForAmount
    );

    oThis.amount = basicHelper.convertWeiToNormal(amount);
  }

  /**
   * Get amount for notification.
   *
   * @param supportingEntitiesConfig
   * @returns {*}
   * @private
   */
  _getThankYouTextForNotification(supportingEntitiesConfig) {
    const oThis = this;

    if (!supportingEntitiesConfig.thankYouText) {
      return;
    }

    const dataKeysForThankYouText = supportingEntitiesConfig.thankYouText;

    oThis.thankYouText = NotificationResponseHelper.getKeyDataFromNotification(
      oThis.notificationHookPayload,
      dataKeysForThankYouText
    );
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
   * Fetch badge counts map.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchBadgeCounts() {
    const oThis = this;

    oThis.userIdToBadgeCountMap = await new UserNotificationsCountModel().fetchUnreadNotificationCount({
      userIds: oThis.userIds
    });

    console.log('oThis.userIdToBadgeCountMap-------', oThis.userIdToBadgeCountMap);
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

    formattedMessagePayload.notification = {
      title: 'New notification from Pepo',
      body: oThis.heading.title //JSON.stringify(heading.body)
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
      // // collapse_key: 'abc',
      notification: {
        //tag: 'unique tray2',
        // // notification_count: 2
      }
    };

    return {
      formattedPayload: formattedMessagePayload,
      userIdToBadgeCountMap: oThis.userIdToBadgeCountMap
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
