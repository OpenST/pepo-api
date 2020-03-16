const rootPrefix = '../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserNotificationPublisherBase = require(rootPrefix + '/lib/userNotificationPublisher/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  notificationHookConstants = require(rootPrefix + '/lib/globalConstant/big/notificationHook');

/**
 * Constructor for Session Auth done.
 *
 * @class SessionAuthPublisher
 */
class SessionAuthPublisher extends UserNotificationPublisherBase {
  /**
   * Constructor for session auth .
   *
   * @param {object} params
   * @param {Integer} params.userId
   * @param {Integer} params.sessionAuthPayloadId
   *
   * @augments UserNotificationPublisherBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.userId = params.userId;
    oThis.sessionAuthPayloadId = params.sessionAuthPayloadId;
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

    await oThis._insertIntoNotificationHook();

    return responseHelper.successWithData({ push_notification_created: oThis.pushNotificationCreated });
  }

  /**
   * Validate and sanitize parameters.
   *
   * @return {Promise<void>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    logger.log('Start:: Validate for SessionAuth');
    let hasError = false;

    if (
      !CommonValidators.validateNonZeroInteger(oThis.userId) ||
      !CommonValidators.validateNonZeroInteger(oThis.sessionAuthPayloadId)
    ) {
      hasError = true;
    }

    if (hasError) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_unp_udt_sa_1',
          api_error_identifier: 'invalid_api_params',
          debug_options: { sessionAuthPayloadId: oThis.sessionAuthPayloadId, userId: oThis.userId }
        })
      );
    }

    logger.log('End:: Validate for SessionAuth');
  }

  /**
   * Set payload for notification.
   *
   * @sets oThis.publishUserIds, oThis.payload
   *
   * @returns {Promise<void>}
   * @private
   */
  _setNotificationCentrePayload() {
    const oThis = this;

    logger.log('Start:: _setNotificationCentrePayload for SessionAuth');

    oThis.publishUserIds = [oThis.userId];

    oThis.payload = {
      actorIds: ['0'],
      actorCount: 1,
      subjectUserId: oThis.userId,
      payload: {
        sessionAuthPayloadId: oThis.sessionAuthPayloadId
      }
    };

    logger.log('End:: _setNotificationCentrePayload for SessionAuth');
  }

  /**
   * Set hook kind.
   *
   * @returns {string}
   * @private
   */
  _notificationHookKind() {
    return notificationHookConstants.sessionAuthKind;
  }
}

module.exports = SessionAuthPublisher;
