const rootPrefix = '../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserNotificationPublisherBase = require(rootPrefix + '/lib/userNotificationPublisher/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  transactionConstants = require(rootPrefix + '/lib/globalConstant/transaction'),
  notificationJobConstants = require(rootPrefix + '/lib/globalConstant/notificationJob'),
  userNotificationConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userNotification');

/**
 * Constructor for video user transaction send Failure publishing.
 *
 * @class VideoTransactionSendFailure
 */
class VideoTransactionSendFailure extends UserNotificationPublisherBase {
  /**
   * Constructor for video user transaction send Failure publishing.
   *
   * @param {object} params
   * @param {object} params.transaction
   * @param {string} params.transaction.status
   * @param {string/number} params.transaction.id
   * @param {string/number} params.transaction.fromUserId
   * @param {object} params.transaction.extraData
   * @param {array<string/number>} params.transaction.extraData.toUserIds
   * @param {number/string} params.videoId
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.transaction = params.transaction;
    oThis.videoId = params.videoId;
  }

  /**
   * Async performer.
   *
   * @return {Promise<void>}
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
   * @return {Promise<void>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    let hasError = false;
    const tx = oThis.transaction;

    logger.log('Start:: Validate for VideoTransactionSendFailure');

    if (!CommonValidators.validateNonZeroInteger(oThis.videoId)) {
      hasError = true;
    }

    if (!CommonValidators.validateNonEmptyObject(tx)) {
      hasError = true;
    }

    if (!hasError && tx.status !== transactionConstants.failedStatus) {
      hasError = true;
    }

    if (!hasError && (!tx.id || !tx.fromUserId || !tx.extraData.toUserIds || tx.extraData.toUserIds.length !== 1)) {
      hasError = true;
    }

    if (hasError) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'l_unp_vtsf_vas_1',
          api_error_identifier: 'invalid_api_params',
          debug_options: { transaction: oThis.transaction, videoId: oThis.videoId }
        })
      );
    }

    logger.log('End:: Validate for VideoTransactionSendFailure');
  }

  /**
   * Topic name for the job.
   *
   * @return {string}
   * @private
   */
  _jobTopic() {
    return notificationJobConstants.videoTxSendFailure;
  }

  /**
   * Set payload for notification.
   *
   * @sets oThis.publishUserIds, oThis.payload
   *
   * @return {Promise<void>}
   * @private
   */
  _setPayload() {
    const oThis = this;
    logger.log('Start:: _setPayload for VideoTransactionSendFailure');

    oThis.publishUserIds = [oThis.transaction.fromUserId];

    oThis.payload = {
      actorIds: [oThis.transaction.fromUserId],
      actorCount: 1,
      subjectUserId: oThis.transaction.extraData.toUserIds[0],
      payload: {
        transactionId: oThis.transaction.id,
        videoId: oThis.videoId,
        amount: oThis.transaction.extraData.amounts[0]
      }
    };

    logger.log('End:: _setPayload for VideoTransactionSendFailure');
  }

  /**
   * Set user notification kind.
   *
   * @return {Promise<void>}
   * @private
   */
  _userNotificationKind() {
    return userNotificationConstants.videoTxSendFailureKind;
  }
}

module.exports = VideoTransactionSendFailure;
