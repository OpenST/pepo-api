const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  base64Helper = require(rootPrefix + '/lib/base64Helper'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserNotificationModel = require(rootPrefix + '/app/models/cassandra/UserNotification'),
  ContributionThanksPublisher = require(rootPrefix + '/lib/userNotificationPublisher/ContributionThanks'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for thank you notification.
 *
 * @class SayThankYou
 */
class SayThankYou extends ServiceBase {
  /**
   * Constructor for thank you notification.
   *
   * @param {object} params
   * @param {string} params.text
   * @param {string} params.id
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.text = params.text;
    oThis.notificationId = params.id;
    oThis.notificationId =
      'eyJ1c2VyX2lkIjoxMDAwMSwibGFzdF9hY3Rpb25fdGltZXN0YW1wIjoxMjM1NDMyNDMyMSwidXVpZCI6ImMzN2Q2NjFkLTdlNjEtNDllYS05NmE1LTY4YzM0ZTgzZGIzYSJ9';
    oThis.userNotificationObj = {};
    oThis.decryptedNotificationParams = {};
  }

  /**
   * Main performer for class.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    oThis._validateText(oThis.text);

    oThis._decryptNotificationId();

    await oThis._fetchAndValidateUserNotification();

    await oThis._updateUserNotification();

    await oThis._enqueueUserNotification();

    return responseHelper.successWithData({});
  }

  /**
   * Decrypt notification id.
   *
   * @return {any}
   */
  _decryptNotificationId() {
    const oThis = this;
    oThis.decryptedNotificationParams = JSON.parse(base64Helper.decode(oThis.notificationId));
  }

  /**
   * Validate text
   *
   * @param text
   * @private
   */
  _validateText(text) {
    const oThis = this;
    oThis.text = CommonValidators.sanitizeText(oThis.text);
    if (!CommonValidators.validateMaxLengthMediumString(oThis.text)) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_u_n_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_text'],
          debug_options: { text: oThis.text }
        })
      );
    }
  }

  /**
   * Fetch and validate user notification.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchAndValidateUserNotification() {
    const oThis = this;
    oThis.userNotificationObj = await new UserNotificationModel().fetchUserNotification(
      oThis.decryptedNotificationParams
    );
    //todo validate userNotificationObj must be present

    let thankYouFlag = oThis.userNotificationObj.thankYouFlag;
    if (thankYouFlag === 1) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_u_n_2',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_thank_you_flag'],
          debug_options: { thankYouFlag: thankYouFlag }
        })
      );
    }
  }

  /**
   * Update user notification.
   *
   * @private
   */
  async _updateUserNotification() {
    const oThis = this;
    let queryParams = {
      thankYouFlag: 1,
      userId: oThis.userNotificationObj.userId,
      lastActionTimestamp: oThis.userNotificationObj.lastActionTimestamp,
      uuid: oThis.userNotificationObj.uuid,
      kind: oThis.userNotificationObj.kind
    };
    await new UserNotificationModel().updateThankYouFlag(queryParams);
    oThis.userNotificationObj.thankYouFlag = 1;

    // todo: flush cache on user Notification
  }

  /**
   * Enqueue user notification.
   *
   * @private
   */
  async _enqueueUserNotification() {
    const oThis = this;
    let params = {
      userNotification: oThis.userNotificationObj,
      text: oThis.text
    };
    await new ContributionThanksPublisher(params).perform();
  }
}

module.exports = SayThankYou;
