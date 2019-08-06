/**
 * Profile User Transaction Receive Success Publishing
 *
 * @module lib/userNotificationPublisher/ProfileTransactionReceiveSuccess
 */

const rootPrefix = '../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserNotificationPublisherBase = require(rootPrefix + '/lib/userNotificationPublisher/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  transactionConstants = require(rootPrefix + '/lib/globalConstant/transaction'),
  notificationJobConstants = require(rootPrefix + '/lib/globalConstant/notificationJob');

/**
 * Constructor for profile user transaction receive success publishing.
 *
 * @class ProfileTransactionReceiveSuccess
 */
class ProfileTransactionReceiveSuccess extends UserNotificationPublisherBase {
  /**
   * Constructor for profile user transaction receive success publishing.
   *
   * @param {object} params
   * @param {object} params.transaction
   * @param {string} params.transaction.status
   * @param {string/number} params.transaction.id
   * @param {string/number} params.transaction.fromUserId
   * @param {array<string/number>} params.transaction.toUserIds
   *
   * @augments UserNotificationPublisherBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.transaction = params.transaction;
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
   * @returns {Promise<void>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    let hasError = false;

    const tx = oThis.transaction;

    logger.log('Start:: Validate for ProfileTransactionReceiveSuccess');

    if (!CommonValidators.validateNonEmptyObject(tx)) {
      hasError = true;
    }

    if (!hasError && tx.status !== transactionConstants.successOstTransactionStatus) {
      hasError = true;
    }

    if (!hasError && (!tx.id || !tx.fromUserId || !tx.toUserIds || tx.toUserIds.length !== 1)) {
      hasError = true;
    }

    if (hasError) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'l_unp_ptrs_vas_1',
          api_error_identifier: 'invalid_api_params',
          debug_options: { transaction: oThis.transaction }
        })
      );
    }

    logger.log('End:: Validate for ProfileTransactionReceiveSuccess');
  }

  /**
   * Topic name for the job.
   *
   * @returns {string}
   * @private
   */
  _jobTopic() {
    return notificationJobConstants.profileTxReceiveSuccess;
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

    logger.log('Start:: _setPayload for ProfileTransactionReceiveSuccess');

    oThis.publishUserIds = [oThis.transaction.toUserIds[0]];

    oThis.payload = {
      actorId: oThis.transaction.fromUserId,
      subjectUserId: oThis.transaction.toUserIds[0],
      transactionId: oThis.transaction.id
    };

    logger.log('End:: _setPayload for ProfileTransactionReceiveSuccess');
  }
}

module.exports = ProfileTransactionReceiveSuccess;
