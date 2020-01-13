const rootPrefix = '../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserNotificationPublisherBase = require(rootPrefix + '/lib/userNotificationPublisher/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  transactionConstants = require(rootPrefix + '/lib/globalConstant/transaction'),
  userNotificationConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userNotification');

/**
 * Class for video user transaction receive success publishing.
 *
 * @class VideoTransactionReceiveSuccess
 */
class VideoTransactionReceiveSuccess extends UserNotificationPublisherBase {
  /**
   * Constructor for video user transaction receive success publishing.
   *
   * @param {object} params
   * @param {object} params.transaction
   * @param {string} params.transaction.status
   * @param {string/number} params.transaction.id
   * @param {string/number} params.transaction.fromUserId
   * @param {object} params.transaction.extraData
   * @param {array<string/number>} params.transaction.toUserId
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

    await oThis._setNotificationCentrePayload();

    await oThis.enqueueUserNotification();

    await oThis._insertIntoAggregatedNotificationsTable();

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

    logger.log('Start:: Validate for VideoTransactionReceiveSuccess');

    if (!CommonValidators.validateNonZeroInteger(oThis.videoId)) {
      hasError = true;
    }

    if (!CommonValidators.validateNonEmptyObject(tx)) {
      hasError = true;
    }

    if (!hasError && tx.status !== transactionConstants.doneStatus) {
      hasError = true;
    }

    if (!hasError && (!tx.id || !tx.fromUserId || !tx.toUserId)) {
      hasError = true;
    }

    if (hasError) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_unp_vtrs_vas_1',
          api_error_identifier: 'invalid_api_params',
          debug_options: { transaction: oThis.transaction, videoId: oThis.videoId }
        })
      );
    }

    logger.log('End:: Validate for VideoTransactionReceiveSuccess');
  }

  /**
   * Set payload for notification.
   *
   * @sets oThis.payload, oThis.publishUserIds
   *
   * @return {Promise<void>}
   * @private
   */
  _setNotificationCentrePayload() {
    const oThis = this;
    logger.log('Start:: _setNotificationCentrePayload for VideoTransactionReceiveSuccess');

    oThis.publishUserIds = [oThis.transaction.toUserId];

    oThis.payload = {
      actorIds: [oThis.transaction.fromUserId],
      actorCount: 1,
      subjectUserId: oThis.transaction.toUserId,
      payload: {
        transactionId: oThis.transaction.id,
        videoId: oThis.videoId,
        amount: oThis.transaction.amount
      },
      thankYouFlag: 0
    };

    logger.log('End:: _setNotificationCentrePayload for VideoTransactionReceiveSuccess');
  }

  /**
   * Set user notification kind.
   *
   * @returns {string}
   * @private
   */
  _userNotificationKind() {
    return userNotificationConstants.videoTxReceiveSuccessKind;
  }
}

module.exports = VideoTransactionReceiveSuccess;
