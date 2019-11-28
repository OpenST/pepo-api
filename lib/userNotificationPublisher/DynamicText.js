const rootPrefix = '../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserNotificationPublisherBase = require(rootPrefix + '/lib/userNotificationPublisher/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  userNotificationConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userNotification'),
  notificationHookConstants = require(rootPrefix + '/lib/globalConstant/notificationHook');

/**
 * Constructor for dynamic text.
 *
 * @class DynamicText
 */
class DynamicText extends UserNotificationPublisherBase {
  /**
   * Constructor .
   *
   * @param {object} params
   *
   * @augments UserNotificationPublisherBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.dynamicText = params.dynamicText;
    oThis.url = params.url;
    oThis.userId = params.userId;
  }

  /**
   * Async performer.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    await oThis._setNotificationCentrePayload();

    await oThis._publishForUserIds();

    return responseHelper.successWithData({});
  }

  /**
   * Validate and sanitize parameters.
   *
   * @return {Promise<void>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    logger.log('Start:: Validate for DynamicText');
    let hasError = false;

    if (
      !CommonValidators.validateNonZeroInteger(oThis.userId) ||
      !CommonValidators.validateNonBlankString(oThis.dynamicText) ||
      !CommonValidators.validateGenericUrl(oThis.url)
    ) {
      hasError = true;
    }

    if (hasError) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_unp_udt_vas_1',
          api_error_identifier: 'invalid_api_params',
          debug_options: { dynamicText: oThis.dynamicText, userId: oThis.userId, url: oThis.url }
        })
      );
    }

    logger.log('End:: Validate for DynamicText');
  }

  /**
   * Set payload for notification.
   *
   * @sets oThis.payload
   *
   * @return {Promise<void>}
   * @private
   */
  async _setNotificationCentrePayload() {
    const oThis = this;
    logger.log('Start:: _setNotificationCentrePayload for DynamicText');

    oThis.payload = {
      actorIds: [oThis.userId],
      actorCount: 1,
      subjectUserId: oThis.userId,
      payload: {
        url: oThis.url,
        dynamicText: oThis.dynamicText
      }
    };

    logger.log('End:: _setNotificationCentrePayload for DynamicText');
  }

  /**
   * Publish.
   *
   * @sets oThis.publishUserIds
   *
   * @return {Promise<void>}
   * @private
   */
  async _publishForUserIds() {
    const oThis = this;
    logger.log('Start:: _fetchPublishUserIds for DynamicText');

    oThis.publishUserIds = [oThis.userId];

    console.log('oThis.publishUserIds----', oThis.publishUserIds);

    if (oThis.publishUserIds.length > 0) {
      await oThis.enqueueUserNotification();
    }

    logger.log('End:: _fetchPublishUserIds for DynamicText');
  }

  /**
   * Set user notification kind.
   *
   * @returns {string}
   * @private
   */
  _userNotificationKind() {
    return userNotificationConstants.dynamicTextKind;
  }

  /**
   * Set hook kind.
   *
   * @returns {string}
   * @private
   */
  _notificationHookKind() {
    return notificationHookConstants.dynamicTextKind;
  }
}

module.exports = DynamicText;
