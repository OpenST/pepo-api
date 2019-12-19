const rootPrefix = '../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserNotificationPublisherBase = require(rootPrefix + '/lib/userNotificationPublisher/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  notificationJobConstants = require(rootPrefix + '/lib/globalConstant/notificationJob'),
  notificationHookConstants = require(rootPrefix + '/lib/globalConstant/notificationHook'),
  userNotificationConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userNotification');

/**
 * Constructor for contribution thanks publishing.
 *
 * @class ContributionThanks
 */
class ContributionThanks extends UserNotificationPublisherBase {
  /**
   * Constructor for contribution thanks publishing.
   *
   * @param {object} params
   * @param {object} params.userNotification
   * @param {string} params.userNotification.kind
   * @param {string/number} params.userNotification.transactionId
   * @param {string/number} params.userNotification.subjectUserId
   * @param {array<string/number>} params.userNotification.actorIds
   * @param {string} params.text
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.userNotification = params.userNotification;
    oThis.text = params.text;

    oThis.transactionId = null;
    oThis.senderUserId = null;
    oThis.receiverUserId = null;
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

    await oThis.enqueueUserNotification();

    // Insert into notification_hooks table for hook push notifications.
    await oThis._insertIntoNotificationHook();

    return responseHelper.successWithData({});
  }

  /**
   * Validate and sanitize parameters.
   *
   * @sets oThis.transactionId, oThis.senderUserId, oThis.receiverUserId
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    let hasError = false;

    logger.log('Start:: Validate for ContributionThanks.');

    if (!CommonValidators.validateNonEmptyObject(oThis.userNotification)) {
      hasError = true;
    }

    if (
      !hasError &&
      (!oThis.userNotification.kind ||
        [
          userNotificationConstants.profileTxReceiveSuccessKind,
          userNotificationConstants.videoTxReceiveSuccessKind,
          userNotificationConstants.replyTxReceiveSuccessKind
        ].indexOf(oThis.userNotification.kind) === -1)
    ) {
      hasError = true;
    }

    if (
      !hasError &&
      (!oThis.userNotification.payload.transactionId ||
        !oThis.userNotification.subjectUserId ||
        !oThis.userNotification.actorIds ||
        oThis.userNotification.actorIds.length !== 1)
    ) {
      hasError = true;
    }

    if (!hasError && !CommonValidators.validateString(oThis.text)) {
      hasError = true;
    }

    // Validate text.

    if (hasError) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_unp_ct_vas_1',
          api_error_identifier: 'invalid_api_params',
          debug_options: { userNotification: oThis.userNotification, text: oThis.text }
        })
      );
    }

    oThis.transactionId = oThis.userNotification.payload.transactionId;
    oThis.senderUserId = oThis.userNotification.subjectUserId;
    oThis.receiverUserId = oThis.userNotification.actorIds[0];

    logger.log('End:: Validate for ContributionThanks');
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
    logger.log('Start:: _setNotificationCentrePayload for ContributionThanks');

    oThis.publishUserIds = [oThis.receiverUserId];

    oThis.payload = {
      actorIds: [oThis.senderUserId],
      actorCount: 1,
      subjectUserId: oThis.receiverUserId,
      payload: {
        transactionId: oThis.transactionId,
        thankYouText: oThis.text
      }
    };

    logger.log('End:: _setNotificationCentrePayload for ContributionThanks');
  }

  /**
   * Set user notification kind.
   *
   * @returns {string}
   * @private
   */
  _userNotificationKind() {
    return userNotificationConstants.contributionThanksKind;
  }

  /**
   * Set hook kind.
   *
   * @returns {string}
   * @private
   */
  _notificationHookKind() {
    return notificationHookConstants.contributionThanksKind;
  }
}

module.exports = ContributionThanks;
