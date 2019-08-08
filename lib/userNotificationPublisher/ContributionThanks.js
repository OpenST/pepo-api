const rootPrefix = '../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserNotificationPublisherBase = require(rootPrefix + '/lib/userNotificationPublisher/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  notificationJobConstants = require(rootPrefix + '/lib/globalConstant/notificationJob'),
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

    await oThis._setPayload();

    await oThis.enqueueUserNotification();

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
          userNotificationConstants.videoTxReceiveSuccessKind
        ].indexOf(oThis.userNotification.kind) === -1)
    ) {
      hasError = true;
    }

    if (
      !hasError &&
      (!oThis.userNotification.transactionId ||
        !oThis.userNotification.subjectUserId ||
        !oThis.userNotification.actorIds ||
        oThis.userNotification.actorIds.length !== 1)
    ) {
      hasError = true;
    }

    if (!hasError && !CommonValidators.validateNonEmptyObject(oThis.text)) {
      hasError = true;
    }

    // Validate text.

    if (hasError) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'l_unp_ct_vas_1',
          api_error_identifier: 'invalid_api_params',
          debug_options: { userNotification: oThis.userNotification, text: oThis.text }
        })
      );
    }

    oThis.transactionId = oThis.userNotification.transactionId;
    oThis.senderUserId = oThis.userNotification.subjectUserId;
    oThis.receiverUserId = oThis.userNotification.actorIds[0];

    logger.log('End:: Validate for ContributionThanks');
  }

  /**
   * Topic name for the job.
   *
   * @returns {string}
   * @private
   */
  _jobTopic() {
    return notificationJobConstants.contributionThanks;
  }

  /**
   * Set payload for notification.
   *
   * @sets oThis.publishUserIds, oThis.payload
   *
   * @returns {Promise<void>}
   * @private
   */
  _setPayload() {
    const oThis = this;
    logger.log('Start:: _setPayload for ContributionThanks');

    oThis.publishUserIds = [oThis.receiverUserId];

    oThis.payload = {
      actorIds: [oThis.senderUserId],
      actorCount: 1,
      subjectUserId: oThis.receiverUserId,
      transactionId: oThis.transaction.id
    };

    logger.log('End:: _setPayload for ContributionThanks');
  }

  /**
   * Set user notification kind.
   *
   * @return {Promise<void>}
   * @private
   */
  _userNotificationKind() {
    return userNotificationConstants.contributionThanksKind;
  }
}

module.exports = ContributionThanks;
