const rootPrefix = '../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserNotificationPublisherBase = require(rootPrefix + '/lib/userNotificationPublisher/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  transactionConstants = require(rootPrefix + '/lib/globalConstant/transaction'),
  notificationJobConstants = require(rootPrefix + '/lib/globalConstant/notificationJob');

/**
 * Constructor for video user transaction send success publishing.
 *
 * @class VideoTransactionSendSuccess
 */
class VideoTransactionSendSuccess extends UserNotificationPublisherBase {
  /**
   * Constructor for video user transaction send success publishing.
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

    logger.log('Start:: Validate for VideoTransactionSendSuccess');

    if (!CommonValidators.validateNonZeroInteger(oThis.videoId)) {
      hasError = true;
    }

    if (!CommonValidators.validateNonEmptyObject(tx)) {
      hasError = true;
    }

    if (!hasError && tx.status !== transactionConstants.successOstTransactionStatus) {
      hasError = true;
    }

    if (!hasError && (!tx.id || !tx.fromUserId || !tx.extraData.toUserIds || tx.extraData.toUserIds.length !== 1)) {
      hasError = true;
    }

    if (hasError) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'l_unp_vtss_vas_1',
          api_error_identifier: 'invalid_api_params',
          debug_options: { transaction: oThis.transaction, videoId: oThis.videoId }
        })
      );
    }

    logger.log('End:: Validate for VideoTransactionSendSuccess');
  }

  /**
   * Topic name for the job.
   *
   * @return {string}
   * @private
   */
  _jobTopic() {
    return notificationJobConstants.videoTxSendSuccess;
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
    logger.log('Start:: _setPayload for VideoTransactionSendSuccess');

    oThis.publishUserIds = [oThis.transaction.fromUserId];

    oThis.payload = {
      actorId: oThis.transaction.fromUserId,
      subjectUserId: oThis.transaction.extraData.toUserIds[0],
      transactionId: oThis.transaction.id,
      videoId: oThis.videoId
    };

    logger.log('End:: _setPayload for VideoTransactionSendSuccess');
  }
}

module.exports = VideoTransactionSendSuccess;
