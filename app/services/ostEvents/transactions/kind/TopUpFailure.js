const rootPrefix = '../../../..',
  FiatPaymentModel = require(rootPrefix + '/app/models/mysql/FiatPayment'),
  TransactionKindBase = require(rootPrefix + '/app/services/ostEvents/transactions/kind/Base'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  transactionConstants = require(rootPrefix + '/lib/globalConstant/transaction'),
  notificationJobEnqueue = require(rootPrefix + '/lib/rabbitMqEnqueue/notification'),
  notificationJobConstants = require(rootPrefix + '/lib/globalConstant/notificationJob'),
  fiatPaymentConstants = require(rootPrefix + '/lib/globalConstant/fiatPayment');

/**
 * Class for topup failure transaction service.
 *
 * @class TopUpFailureFailureKind
 */
class TopUpFailureFailureKind extends TransactionKindBase {
  /**
   * Async perform.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    const promiseArray = [];

    promiseArray.push(oThis.fetchTransaction());
    promiseArray.push(oThis.setFromAndToUserId());

    if (oThis.isVideoIdPresent()) {
      promiseArray.push(oThis.fetchVideoAndValidate());
    }

    await Promise.all(promiseArray);

    if (oThis.transactionObj) {
      await oThis._processTransaction();
    } else {
      const insertResponse = await oThis.insertInTransaction();
      if (insertResponse.isDuplicateIndexViolation) {
        await basicHelper.sleep(500);
        await oThis.fetchTransaction();
        await oThis._processTransaction();
      } else {
        await oThis._sendUserTransactionNotification();
      }
    }

    return responseHelper.successWithData({});
  }

  /**
   * Process transaction when transaction is found in database.
   *
   * @returns {Promise<any>}
   * @private
   */
  async _processTransaction() {
    const oThis = this;

    const response = await oThis.validateTransactionObj();

    if (response.isFailure()) {
      // Transaction status need not be changed.
      return responseHelper.successWithData({});
    }

    await oThis.validateToUserId();
    const promiseArray = [];
    promiseArray.push(oThis.updateTransaction());
    promiseArray.push(oThis.processForTopUpTransaction());
    promiseArray.push(
      FiatPaymentModel.flushCache({
        fiatPaymentId: oThis.transactionObj.fiatPaymentId,
        userId: oThis.toUserId
      })
    );
    promiseArray.push(oThis._enqueueUserNotification(notificationJobConstants.topupFailed));

    const errorObject = responseHelper.error({
      internal_error_identifier: 'a_s_oe_t_1',
      api_error_identifier: 'could_not_proceed',
      debug_options: {
        message: 'URGENT :: Topup of pepo could not be started after successful payment.',
        transactionObj: JSON.stringify(oThis.transactionObj)
      }
    });
    logger.error('Topup of pepo could not be started after successful payment.', errorObject);
    await createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);

    await Promise.all(promiseArray);
  }

  /**
   * Send notification for successful transaction.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _sendUserTransactionNotification() {
    const oThis = this;

    const promisesArray = [];

    if (oThis.videoId) {
      promisesArray.push(
        notificationJobEnqueue.enqueue(notificationJobConstants.videoTxSendFailure, {
          transaction: oThis.transactionObj,
          videoId: oThis.videoId
        })
      );
    } else {
      promisesArray.push(
        notificationJobEnqueue.enqueue(notificationJobConstants.profileTxSendFailure, {
          transaction: oThis.transactionObj
        })
      );
    }

    await Promise.all(promisesArray);
  }

  /**
   * Return transaction status.
   *
   * @return {string}
   * @private
   */
  _validTransactionStatus() {
    return transactionConstants.failedOstTransactionStatus;
  }

  /**
   * Transaction status.
   *
   * @returns {string}
   * @private
   */
  _transactionStatus() {
    return transactionConstants.failedStatus;
  }

  _getPaymentStatus() {
    return fiatPaymentConstants.invertedStatuses[fiatPaymentConstants.pepoTransferFailedStatus];
  }
}

module.exports = TopUpFailureFailureKind;
