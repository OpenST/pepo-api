const rootPrefix = '../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserNotificationPublisherBase = require(rootPrefix + '/lib/userNotificationPublisher/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  transactionConstants = require(rootPrefix + '/lib/globalConstant/transaction'),
  userNotificationConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userNotification');

/**
 * Class for reply user transaction receive success publishing.
 *
 * @class ReplyTransactionReceiveSuccess
 */
class ReplyTransactionReceiveSuccess extends UserNotificationPublisherBase {
  /**
   * Constructor for reply user transaction receive success publishing.
   *
   * @param {object} params
   * @param {object} params.transaction
   * @param {string} params.transaction.status
   * @param {string/number} params.transaction.id
   * @param {string/number} params.transaction.fromUserId
   * @param {object} params.transaction.extraData
   * @param {array<string/number>} params.transaction.extraData.toUserIds
   * @param {number/string} params.videoId
   * @param {number/string} params.parentVideoId
   * @param {number/string} params.replyDetailId
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.transaction = params.transaction;
    oThis.videoId = params.videoId;
    oThis.parentVideoId = params.parentVideoId;
    oThis.replyDetailId = params.replyDetailId;
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

    logger.log('Start:: Validate for ReplyTransactionReceiveSuccess');

    if (
      !CommonValidators.validateNonZeroInteger(oThis.videoId) ||
      !CommonValidators.validateNonZeroInteger(oThis.parentVideoId) ||
      !CommonValidators.validateNonEmptyObject(tx) ||
      (!hasError && tx.status !== transactionConstants.doneStatus) ||
      (!hasError && (!tx.id || !tx.fromUserId || !tx.extraData.toUserIds || tx.extraData.toUserIds.length !== 1)) ||
      !CommonValidators.validateNonZeroInteger(oThis.replyDetailId)
    ) {
      hasError = true;
    }

    if (hasError) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_unp_rtrs_vas_1',
          api_error_identifier: 'invalid_api_params',
          debug_options: { transaction: oThis.transaction, videoId: oThis.videoId }
        })
      );
    }

    logger.log('End:: Validate for ReplyTransactionReceiveSuccess');
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
    logger.log('Start:: _setNotificationCentrePayload for ReplyTransactionReceiveSuccess');

    oThis.publishUserIds = [oThis.transaction.extraData.toUserIds[0]];

    oThis.payload = {
      actorIds: [oThis.transaction.fromUserId],
      actorCount: 1,
      subjectUserId: oThis.transaction.extraData.toUserIds[0],
      payload: {
        transactionId: oThis.transaction.id,
        videoId: oThis.videoId,
        replyDetailId: oThis.replyDetailId,
        parentVideoId: oThis.parentVideoId,
        amount: oThis.transaction.extraData.amounts[0]
      },
      thankYouFlag: 0
    };

    logger.log('End:: _setNotificationCentrePayload for ReplyTransactionReceiveSuccess');
  }

  /**
   * Set user notification kind.
   *
   * @returns {string}
   * @private
   */
  _userNotificationKind() {
    return userNotificationConstants.replyTxReceiveSuccessKind;
  }
}

module.exports = ReplyTransactionReceiveSuccess;
