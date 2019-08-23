const rootPrefix = '../../..',
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
  }

  /**
   * Main performer method.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis._validate();

    return oThis._processHook();
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

    if (!oThis.hook.recipients || !Array.isArray(oThis.hook.recipients)) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_pnp_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { pushNotificationsRecipients: oThis.hook.recipients }
        })
      );
    }

    if (!oThis.hook.pushNotificationPayload || !CommonValidators.validateObject(oThis.hook.pushNotificationPayload)) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_pnp_2',
          api_error_identifier: 'something_went_wrong',
          debug_options: { pushNotificationsPayload: oThis.hook.pushNotificationPayload }
        })
      );
    }
  }

  /**
   * Process hook.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _processHook() {
    const oThis = this;

    let userIds = oThis.hook.recipients,
      pushNotificationPayload = oThis.hook.pushNotificationPayload;

    // Send push notification only if payload is present.
    if (CommonValidators.validateNonEmptyObject(pushNotificationPayload)) {
      return responseHelper.successWithData({});
    }

    return oThis._sendPushNotification(userIds, pushNotificationPayload);
  }

  /**
   * Send Push Notification.
   *
   * @param userIds
   * @param pushNotificationPayload
   * @returns {Promise<void>}
   * @private
   */
  async _sendPushNotification(userIds, pushNotificationPayload) {
    // call push notification wrapper here.
  }
}

module.exports = PushNotificationProcessor;
