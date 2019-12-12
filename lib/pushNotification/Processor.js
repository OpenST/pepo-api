const rootPrefix = '../..',
  basicHelper = require(rootPrefix + '/helpers/basic'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserDeviceByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserDeviceByIds'),
  PushNotificationMsgFormatter = require(rootPrefix + '/lib/pushNotification/MsgFormatter'),
  UserNotificationCountModel = require(rootPrefix + '/app/models/cassandra/UserNotificationCount'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  userDeviceConstants = require(rootPrefix + '/lib/globalConstant/userDevice'),
  firebaseAdminSdkWrapper = require(rootPrefix + '/lib/pushNotification/firebase/adminSdk');

/**
 * Class for push notification processor.
 *
 * @class PushNotificationProcessor
 */
class PushNotificationProcessor {
  /**
   * Constructor for PushNotificationProcessor.
   *
   * @param params
   * @param {hash} params.hook - db record(hook) of notification hook table
   *
   */
  constructor(params) {
    const oThis = this;

    oThis.hook = params.hook;

    oThis.userDeviceIds = oThis.hook.userDeviceIds;
    oThis.rawPayload = oThis.hook.rawNotificationPayload;
    oThis.eventType = oThis.hook.eventType;

    oThis.payload = {};
    oThis.messageParams = {};
    oThis.userDeviceDetails = {};
    oThis.userIdToBadgeCountMap = {};
  }

  /**
   * Main performer method.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis._validate();

    await oThis._fetchDeviceTokens();

    await oThis._fetchBadgeCount();

    await oThis._formatPayload();

    return oThis._sendPushNotifications();
  }

  /**
   * Validate params.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validate() {
    const oThis = this;

    if (!oThis.userDeviceIds || !Array.isArray(oThis.userDeviceIds) || oThis.userDeviceIds.length === 0) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_pn_p_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { userDeviceIds: oThis.userDeviceIds }
        })
      );
    }

    if (!oThis.rawPayload || !CommonValidators.validateObject(oThis.rawPayload)) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_pn_p_2',
          api_error_identifier: 'something_went_wrong',
          debug_options: { rawNotificationPayload: oThis.rawPayload }
        })
      );
    }
  }

  /**
   * Fetch device token details from cache.
   *
   * @sets oThis.userDeviceDetails
   *
   * @returns {Promise<*>}
   * @private
   */
  async _fetchDeviceTokens() {
    const oThis = this;

    logger.log('oThis.userDeviceIds  =======', oThis.userDeviceIds);

    const userDeviceCacheRsp = await new UserDeviceByIdsCache({ ids: oThis.userDeviceIds }).fetch();
    if (userDeviceCacheRsp.isFailure()) {
      return Promise.reject(userDeviceCacheRsp);
    }

    oThis.userDeviceDetails = userDeviceCacheRsp.data;
  }

  /**
   * Fetch badge count from user notification count table.
   *
   * @sets oThis.userDeviceDetails
   *
   * @returns {Promise<*>}
   * @private
   */
  async _fetchBadgeCount() {
    const oThis = this;

    let userIds = [];

    for (const userDeviceId in oThis.userDeviceDetails) {
      const userId = oThis.userDeviceDetails[userDeviceId].userId;
      // TEMP code fix for 128 cassandra driver issue
      if (userId == 128) {
        continue;
      }
      userIds.push(userId);
    }

    userIds = [...new Set(userIds)];

    if (userIds.length > 0) {
      oThis.userIdToBadgeCountMap = await new UserNotificationCountModel().fetchUnreadNotificationCount({
        userIds: userIds
      });
    }

    logger.log('oThis.userIdToBadgeCountMap ==========', oThis.userIdToBadgeCountMap);
  }

  /**
   * Format payload.
   *
   * @sets oThis.payload
   *
   * @returns {Promise<void>}
   * @private
   */
  async _formatPayload() {
    const oThis = this;

    const pushNotificationFormatterRsp = await new PushNotificationMsgFormatter({
      notificationHookPayload: oThis.rawPayload,
      kind: oThis.eventType
    }).perform();

    logger.log('===== Push notification formatter response :::', pushNotificationFormatterRsp);

    if (pushNotificationFormatterRsp.isFailure()) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_pn_p_3',
          api_error_identifier: 'something_went_wrong',
          debug_options: { notificationHookId: oThis.hook }
        })
      );
    }

    oThis.messageParams = pushNotificationFormatterRsp.data.formattedPayload;
  }

  /**
   * Send batch notifications.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _sendPushNotifications() {
    const oThis = this;

    const messages = [];

    // Send push notification only if payload is present.
    if (!CommonValidators.validateNonEmptyObject(oThis.hook.rawNotificationPayload)) {
      return responseHelper.successWithData({});
    }

    logger.step('Sending Batch Notifications for :', oThis.userDeviceIds);

    for (let index = 0; index < oThis.userDeviceIds.length; index++) {
      const userDeviceId = oThis.userDeviceIds[index],
        userDevice = oThis.userDeviceDetails[userDeviceId];

      logger.log('User device details ====== User device id:::', oThis.userDeviceDetails, userDeviceId);

      if (userDevice.deviceToken && userDevice.status === userDeviceConstants.activeStatus) {
        const deviceToken = userDevice.deviceToken,
          userId = userDevice.userId;

        let badgeCount = 1;

        if (oThis.userIdToBadgeCountMap[userId] && oThis.userIdToBadgeCountMap[userId] > 0) {
          badgeCount = Number(oThis.userIdToBadgeCountMap[userId]);
        } else {
          badgeCount = 1;
        }

        logger.log('userId  ====== Badge Count ========: ', userId, Number(oThis.userIdToBadgeCountMap[userId]));

        const messageParams = basicHelper.deepDup(oThis.messageParams);

        const message = Object.assign(messageParams, {
          token: deviceToken,
          apns: {
            payload: {
              aps: {
                badge: badgeCount,
                sound: 'default'
              }
            }
          }
        });

        logger.log('message --------------message------message--', message);
        messages.push(message);
      } else {
        logger.error('Device token not found for: ', userDeviceId);
      }
    }

    if (messages.length > 0) {
      const sendMulticastNotificationRsp = await firebaseAdminSdkWrapper.sendAllNotification(messages),
        sendMulticastNotificationRspData = sendMulticastNotificationRsp.data,
        sendMulticastResponsesMap = {};

      for (let index = 0; index < sendMulticastNotificationRspData.responses.length; index++) {
        const currentUserDeviceId = oThis.userDeviceIds[index];

        sendMulticastResponsesMap[currentUserDeviceId] = sendMulticastNotificationRspData.responses[index];
      }

      return responseHelper.successWithData({
        responseMap: sendMulticastResponsesMap,
        successResponseCount: sendMulticastNotificationRspData.successCount,
        failureResponseCount: sendMulticastNotificationRspData.failureCount
      });
    }

    return responseHelper.successWithData({
      responseMap: {},
      successResponseCount: 0,
      failureResponseCount: 0
    });
  }
}

module.exports = PushNotificationProcessor;
