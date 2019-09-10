const rootPrefix = '../..',
  UserDeviceByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserDeviceByIds'),
  PushNotificationMsgFormatter = require(rootPrefix + '/lib/pushNotification/MsgFormatter'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  firebaseAdminSdkWrapper = require(rootPrefix + '/lib/pushNotification/firebase/adminSdk'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

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

    await oThis._formatPayload();

    return oThis._sendPushNotifications();
  }

  /**
   * Validate params.
   *
   * @sets oThis.sendMailParams
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
   * @Sets oThis.userDeviceDetails
   *
   * @returns {Promise<*>}
   * @private
   */
  async _fetchDeviceTokens() {
    const oThis = this;

    console.log('oThis.userDeviceIds  =======', oThis.userDeviceIds);

    const userDeviceCacheRsp = await new UserDeviceByIdsCache({ ids: oThis.userDeviceIds }).fetch();

    oThis.userDeviceDetails = userDeviceCacheRsp.data;
  }

  /**
   * Send Batch Notifications.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _sendPushNotifications() {
    const oThis = this;

    let messages = [];

    // Send push notification only if payload is present.
    if (!CommonValidators.validateNonEmptyObject(oThis.hook.rawNotificationPayload)) {
      return responseHelper.successWithData({});
    }

    logger.step('Sending Batch Notifications for :', oThis.userDeviceIds);

    for (let i = 0; i < oThis.userDeviceIds.length; i++) {
      let userDeviceId = oThis.userDeviceIds[i];

      logger.log('oThis.userDeviceDetails------message--', oThis.userDeviceDetails, userDeviceId);

      if (oThis.userDeviceDetails[userDeviceId].deviceToken) {
        let deviceToken = oThis.userDeviceDetails[userDeviceId].deviceToken,
          userId = oThis.userDeviceDetails[userDeviceId].userId,
          message = Object.assign(oThis.messageParams, {
            token: deviceToken,
            apns: {
              payload: {
                aps: {
                  badge: Number(oThis.userIdToBadgeCountMap[userId]) || 0
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

    let sendMulticastNotificationRsp = await firebaseAdminSdkWrapper.sendAllNotification(messages),
      sendMulticastNotificationRspData = sendMulticastNotificationRsp.data,
      sendMulticastResponsesMap = {};

    for (let i = 0; i < sendMulticastNotificationRspData.responses.length; i++) {
      let currentUserDeviceId = oThis.userDeviceIds[i];

      sendMulticastResponsesMap[currentUserDeviceId] = sendMulticastNotificationRspData.responses[i];
    }

    return responseHelper.successWithData({
      responseMap: sendMulticastResponsesMap,
      successResponseCount: sendMulticastNotificationRspData.successCount,
      failureResponseCount: sendMulticastNotificationRspData.failureCount
    });
  }

  /**
   * Format payload.
   *
   * @Sets oThis.payload
   *
   * @private
   */
  async _formatPayload() {
    const oThis = this;

    let pushNotificationFormatterRsp = await new PushNotificationMsgFormatter({
      notificationHookPayload: oThis.rawPayload,
      kind: oThis.eventType
    }).perform();

    if (pushNotificationFormatterRsp.isFailure()) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_pn_p_3',
          api_error_identifier: 'something_went_wrong',
          debug_options: { notificationHookId: oThis.hook }
        })
      );
    }

    console.log('pushNotificationFormatterRsp--------', pushNotificationFormatterRsp);

    oThis.messageParams = pushNotificationFormatterRsp.data.formattedPayload;
    oThis.userIdToBadgeCountMap = pushNotificationFormatterRsp.data.userIdToBadgeCountMap;
  }
}

module.exports = PushNotificationProcessor;
