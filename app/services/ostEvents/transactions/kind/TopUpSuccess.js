const rootPrefix = '../../../..',
  UpdateStats = require(rootPrefix + '/lib/UpdateStats'),
  FiatPaymentModel = require(rootPrefix + '/app/models/mysql/FiatPayment'),
  TransactionKindBase = require(rootPrefix + '/app/services/ostEvents/transactions/kind/Base'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  transactionConstants = require(rootPrefix + '/lib/globalConstant/transaction'),
  fiatPaymentConstants = require(rootPrefix + '/lib/globalConstant/fiatPayment'),
  notificationJobEnqueue = require(rootPrefix + '/lib/rabbitMqEnqueue/notification'),
  notificationJobConstants = require(rootPrefix + '/lib/globalConstant/notificationJob');

/**
 * Class for topup success transaction service.
 *
 * @class TopUpSuccessTransactionKind
 */
class TopUpSuccessTransactionKind extends TransactionKindBase {
  /**
   * Async perform.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    const promiseArray = [];

    promiseArray.push(oThis.fetchTransaction());
    promiseArray.push(oThis.setFromAndToUserId());

    await Promise.all(promiseArray);

    if (oThis.transactionObj) {
      // Transaction is found in db. All updates happen in this block.
      await oThis._processTransaction();
    } else {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_oe_t_k_tus_p_1',
          api_error_identifier: 'invalid_api_params',
          debug_options: oThis.ostTransaction
        })
      );
    }

    logger.log('Transaction Obj after receiving webhook: ', oThis.transactionObj);

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Process transaction when transaction is found in the database.
   *
   * @returns {Promise<any>}
   * @private
   */
  async _processTransaction() {
    const oThis = this;

    const response = await oThis.validateTransactionObj();

    if (response.isFailure()) {
      // Transaction status need not be changed.
      return Promise.resolve(responseHelper.successWithData({}));
    }

    await oThis.validateToUserId();
    const promiseArray = [];
    promiseArray.push(oThis.updateTransaction());
    promiseArray.push(oThis.processForTopUpTransaction());
    promiseArray.push(oThis._enqueueUserNotification(notificationJobConstants.topupDone));
    promiseArray.push(
      FiatPaymentModel.flushCache({
        fiatPaymentId: oThis.transactionObj.fiatPaymentId,
        userId: oThis.toUserId
      })
    );
    await Promise.all(promiseArray);
  }

  /**
   * Enqueue user notification.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _enqueueUserNotification(topic) {
    const oThis = this;
    // Notification would be published only if user is approved.
    await notificationJobEnqueue.enqueue(topic, { transaction: oThis.transactionObj });
  }

  /**
   * Return transaction status.
   *
   * @return {string}
   * @private
   */
  _validTransactionStatus() {
    return transactionConstants.successOstTransactionStatus;
  }

  /**
   * Transaction status.
   *
   * @returns {string}
   * @private
   */
  _transactionStatus() {
    return transactionConstants.doneStatus;
  }

  _getPaymentStatus() {
    return fiatPaymentConstants.invertedStatuses[fiatPaymentConstants.pepoTransferSuccessStatus];
  }
}

module.exports = TopUpSuccessTransactionKind;
