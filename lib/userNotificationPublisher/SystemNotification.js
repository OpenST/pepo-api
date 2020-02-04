const rootPrefix = '../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserNotificationPublisherBase = require(rootPrefix + '/lib/userNotificationPublisher/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  userNotificationConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userNotification'),
  notificationHookConstants = require(rootPrefix + '/lib/globalConstant/big/notificationHook');

/**
 * Constructor for system notification.
 *
 * @class SystemNotification
 */
class SystemNotification extends UserNotificationPublisherBase {
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

    oThis.systemNotificationParams = params.systemNotificationParams;
    oThis.userId = params.userId;
    oThis.publishNotification = +params.publishNotification || 0;
    oThis.publishActivity = +params.publishActivity || 0;
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

    logger.log('Start:: Validate for SystemNotification');
    let hasError = false;

    if (
      !CommonValidators.validateNonZeroInteger(oThis.userId) ||
      !CommonValidators.validateNonEmptyObject(oThis.systemNotificationParams) ||
      (!oThis.publishNotification && !oThis.publishActivity)
    ) {
      hasError = true;
    }

    if (hasError) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_unp_udt_vas_1',
          api_error_identifier: 'invalid_api_params',
          debug_options: { systemNotificationParams: oThis.systemNotificationParams, userId: oThis.userId }
        })
      );
    }

    logger.log('End:: Validate for SystemNotification');
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
    logger.log('Start:: _setNotificationCentrePayload for SystemNotification');

    const payload = oThis.systemNotificationParams.payload || {};
    const gotoParams = oThis.systemNotificationParams.gotoParams || {};

    oThis.payload = {
      actorIds: ['0'],
      actorCount: 1,
      subjectUserId: oThis.userId,
      payload: payload
    };

    if (CommonValidators.validateNonEmptyObject(gotoParams)) {
      oThis.payload['gotoParams'] = JSON.stringify(gotoParams);
    }

    logger.log('End:: _setNotificationCentrePayload for SystemNotification');
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
    logger.log('Start:: _fetchPublishUserIds for SystemNotification');

    oThis.publishUserIds = [oThis.userId];

    if (oThis.publishUserIds.length > 0) {
      if (oThis.publishActivity) {
        await oThis.enqueueUserNotification();
      }

      if (oThis.publishNotification) {
        await oThis._insertIntoNotificationHook();
      }
    }

    logger.log('End:: _fetchPublishUserIds for SystemNotification');
  }

  /**
   * Set user notification kind.
   *
   * @returns {string}
   * @private
   */
  _userNotificationKind() {
    return userNotificationConstants.systemNotificationKind;
  }

  /**
   * Set hook kind.
   *
   * @returns {string}
   * @private
   */
  _notificationHookKind() {
    return notificationHookConstants.systemNotificationKind;
  }
}

module.exports = SystemNotification;
