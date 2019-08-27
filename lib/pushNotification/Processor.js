const rootPrefix = '../..',
  PushNotificationSender = require(rootPrefix + '/lib/pushNotification/Sender'),
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

    if (!oThis.hook.recipients || !Array.isArray(oThis.hook.recipients) || oThis.hook.recipients.length === 0) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_pn_p_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { pushNotificationsRecipients: oThis.hook.recipients }
        })
      );
    }

    if (!oThis.hook.rawNotificationPayload || !CommonValidators.validateObject(oThis.hook.rawNotificationPayload)) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_pn_p_2',
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

    // Send push notification only if payload is present.
    if (CommonValidators.validateNonEmptyObject(oThis.hook.rawNotificationPayload)) {
      return responseHelper.successWithData({});
    }

    return new PushNotificationSender({
      userIds: oThis.hook.recipients,
      rawNotificationPayload: oThis.hook.rawNotificationPayload
    }).perform();
  }
}

module.exports = PushNotificationProcessor;
