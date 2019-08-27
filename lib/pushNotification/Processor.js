const rootPrefix = '../..',
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

    if (!oThis.hook.rawNotificationPayload || !CommonValidators.validateObject(oThis.hook.rawNotificationPayload)) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_pnp_2',
          api_error_identifier: 'something_went_wrong',
          debug_options: { rawNotificationPayload: oThis.hook.rawNotificationPayload }
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
      rawNotificationPayload = oThis.hook.rawNotificationPayload;

    // Send push notification only if payload is present.
    if (CommonValidators.validateNonEmptyObject(rawNotificationPayload)) {
      return responseHelper.successWithData({});
    }

    return oThis._sendPushNotification(userIds, rawNotificationPayload);
  }

  /**
   * Send Push Notification.
   *
   * @param userIds
   * @param rawNotificationPayload
   * @returns {Promise<void>}
   * @private
   */
  async _sendPushNotification(userIds, rawNotificationPayload) {
    // call push notification wrapper here.
  }
}

module.exports = PushNotificationProcessor;
