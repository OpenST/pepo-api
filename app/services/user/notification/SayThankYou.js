const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserNotificationModel = require(rootPrefix + '/app/models/cassandra/UserNotification'),
  base64Helper = require(rootPrefix + '/lib/base64Helper'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob'),
  notificationJobEnqueue = require(rootPrefix + '/lib/rabbitMqEnqueue/notification'),
  notificationJobConstants = require(rootPrefix + '/lib/globalConstant/notificationJob');

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
   * @private
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
   * Validate and sanitize params.
   *
   * @returns {Promise<never>}
   */
  async validateAndSanitize() {
    const oThis = this;

    await oThis._decryptNotificationId();

    // if (oThis.decryptedNotificationParams.user_id !== oThis.currentUserId) {
    //   return Promise.reject(
    //     responseHelper.paramValidationError({
    //       internal_error_identifier: 'a_s_u_n_1',
    //       api_error_identifier: 'invalid_api_params',
    //       params_error_identifiers: ['invalid_notification_id'],
    //       debug_options: {
    //         decryptedNotificationParams: oThis.decryptedNotificationParams,
    //         currentUserId: oThis.currentUserId
    //       }
    //     })
    //   );
    // }

    await oThis._validateText();
  }

  /**
   * Decrypt notification id.
   *
   * @sets oThis.decryptedNotificationParams
   *
   * @returns {Promise<*>}
   * @private
   */
  async _decryptNotificationId() {
    const oThis = this;
    try {
      oThis.decryptedNotificationParams = JSON.parse(base64Helper.decode(oThis.notificationId));
    } catch (error) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_u_n_5',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_notification_id'],
          debug_options: {
            error: error,
            notificationId: oThis.notificationId
          }
        })
      );
    }
  }

  /**
   * Validate text.
   *
   * @sets oThis.text
   *
   * @returns {Promise<*>}
   * @private
   */
  async _validateText() {
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
   * @sets oThis.userNotificationObj
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

    const thankYouFlag = oThis.userNotificationObj.thankYouFlag;
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
   * @returns {Promise<void>}
   * @private
   */
  async _updateUserNotification() {
    const oThis = this;

    const queryParams = {
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
   * @returns {Promise<void>}
   * @private
   */
  async _enqueueUserNotification() {
    const oThis = this;

    // Notification would be published only if user is approved.
    await notificationJobEnqueue.enqueue(notificationJobConstants.contributionThanks, {
      userNotification: oThis.userNotificationObj,
      text: oThis.text
    });
  }
}

module.exports = SayThankYou;
