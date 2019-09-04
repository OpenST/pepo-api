const rootPrefix = '../..',
  UserDeviceByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserDeviceByIds'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  notificationResponseConfig = require(rootPrefix + '/lib/notification/config/response'),
  firebaseAdminSdkWrapper = require(rootPrefix + '/lib/pushNotification/firebase/adminSdk'),
  notificationHookConstants = require(rootPrefix + '/lib/globalConstant/notificationHook'),
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

    oThis._formatPayload();

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

    let registrationTokens = [];

    // Send push notification only if payload is present.
    if (!CommonValidators.validateNonEmptyObject(oThis.hook.rawNotificationPayload)) {
      return responseHelper.successWithData({});
    }

    logger.step('Sending Batch Notifications for :', oThis.userDeviceIds);

    for (let i = 0; i < oThis.userDeviceIds.length; i++) {
      let userDeviceId = oThis.userDeviceIds[i];

      if (oThis.userDeviceDetails[userDeviceId].deviceToken) {
        registrationTokens.push(oThis.userDeviceDetails[userDeviceId].deviceToken);
      } else {
        logger.error('Device token not found for: ', userDeviceId);
      }
    }

    let sendMulticastNotificationRsp = await firebaseAdminSdkWrapper.sendMulticastNotification(
        registrationTokens,
        oThis.messageParams
      ),
      sendMulticastResponsesMap = {};

    for (let i = 0; i < sendMulticastNotificationRsp.responses.length; i++) {
      let currentUserDeviceId = oThis.userDeviceIds[i];

      sendMulticastResponsesMap[currentUserDeviceId] = sendMulticastNotificationRsp.responses[i];
    }

    return responseHelper.successWithData({
      responseMap: sendMulticastResponsesMap,
      successResponseCount: sendMulticastNotificationRsp.successCount,
      failureResponseCount: sendMulticastNotificationRsp.failureCount
    });
  }

  /**
   * Format payload.
   *
   * @Sets oThis.payload
   *
   * @private
   */
  _formatPayload() {
    const oThis = this;

    // need discussion.
    // https://firebase.google.com/docs/reference/fcm/rest/v1/projects.messages
    // use go_to.

    oThis.messageParams = {
      notification: {
        title: notificationResponseConfig[oThis.eventType].pushNotification.heading.title,
        body: JSON.stringify(notificationResponseConfig[oThis.eventType].notificationCentre.goto),
        image: 'https://d3attjoi5jlede.cloudfront.net/images/web/fav/192x192.png'
      },
      data: {
        goto: JSON.stringify(notificationResponseConfig[oThis.eventType].notificationCentre.goto)
      },
      apns: {
        payload: {
          aps: {
            'mutable-content': 1
          }
        },
        fcm_options: {
          image: 'https://cdn.dribbble.com/users/12/screenshots/4188789/ost.jpg'
        }
      }
    };
  }
}

module.exports = PushNotificationProcessor;
