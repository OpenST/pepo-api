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
   * @param {string} params.notification_id
   * @param {string} params.current_user.id
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.text = params.text;
    oThis.notificationId = params.notification_id;
    oThis.currentUserId = +params.current_user.id;
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

    await oThis.validateAndSanitize();

    await oThis._fetchAndValidateUserNotification();

    await oThis._updateUserNotification();

    await oThis._enqueueUserNotification();

    return responseHelper.successWithData({});
  }

  /**
   * Validate and sanitize params
   *
   * @returns {Promise<never>}
   */
  async validateAndSanitize() {
    const oThis = this;
    await oThis._decryptNotificationId();
    if (oThis.decryptedNotificationParams.user_id !== oThis.currentUserId) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_u_n_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_notification_id'],
          debug_options: {
            decryptedNotificationParams: oThis.decryptedNotificationParams,
            currentUserId: oThis.currentUserId
          }
        })
      );
    }
    await oThis._validateText(oThis.text);
  }

  /**
   * Decrypt notification id.
   *
   * @return {any}
   */
  async _decryptNotificationId() {
    const oThis = this;
    try {
      oThis.decryptedNotificationParams = JSON.parse(base64Helper.decode(oThis.notificationId));
    } catch (e) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_u_n_5',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_notification_id'],
          debug_options: {
            error: e,
            notificationId: oThis.notificationId
          }
        })
      );
    }
  }

  /**
   * Validate text
   *
   * @param text
   * @private
   */
  async _validateText(text) {
    const oThis = this;
    oThis.text = CommonValidators.sanitizeText(oThis.text);
    if (!CommonValidators.validateMaxLengthMediumString(oThis.text) || oThis.text.length === 0) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_u_n_2',
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

    if (!CommonValidators.validateNonEmptyObject(oThis.userNotificationObj)) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_u_n_3',
          api_error_identifier: 'resource_not_found',
          debug_options: {
            reason: 'Invalid user notification obj.',
            userNotificationObj: oThis.userNotificationObj
          }
        })
      );
    }

    let thankYouFlag = oThis.userNotificationObj.thankYouFlag;
    if (thankYouFlag === 1) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_u_n_4',
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

    await UserNotificationModel.flushCache(oThis.userNotificationObj);
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
