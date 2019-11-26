const rootPrefix = '../../../..',
  UpdateStats = require(rootPrefix + '/lib/UpdateStats'),
  TransactionKindBase = require(rootPrefix + '/app/services/ostEvents/transactions/kind/Base'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  transactionConstants = require(rootPrefix + '/lib/globalConstant/transaction'),
  notificationJobEnqueue = require(rootPrefix + '/lib/rabbitMqEnqueue/notification'),
  notificationJobConstants = require(rootPrefix + '/lib/globalConstant/notificationJob');

/**
 * Class for pepo on reply success transaction service.
 *
 * @class PepoOnReplySuccessTransaction
 */
class PepoOnReplySuccessTransaction extends TransactionKindBase {
  /**
   * Async perform.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    //todo-replies: on success post reply initiate should be called.
    await oThis._validateAndSanitizeParams();

    const promiseArray = [];

    promiseArray.push(oThis.fetchTransaction());
    promiseArray.push(oThis.setFromAndToUserId());

    promiseArray.push(oThis._fetchReplyDetailsAndValidate());

    await Promise.all(promiseArray);

    if (oThis.transactionObj) {
      // Transaction is found in db. All updates happen in this block.
      await oThis._processTransaction();
    } else {
      // When transaction is not found in db. Thus all insertions will happen in this block.
      const insertResponse = await oThis.insertInTransaction();
      if (insertResponse.isDuplicateIndexViolation) {
        await basicHelper.sleep(500);
        await oThis.fetchTransaction();
        await oThis._processTransaction();
      } else {
        //todo-replies: if pepo Reply post kind handle
        const promiseArray2 = [];
        //todo-replies: handle for reply kinds.(updateReplyDetails)
        promiseArray2.push(oThis._sendUserTransactionNotification());
        promiseArray2.push(oThis._updateStats());
        await Promise.all(promiseArray2);
      }
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

    await oThis._updateTransactionAndRelatedActivities();
    await oThis._updateStats();
  }

  /**
   * This function is called when transaction exists in table. This function updates transaction and related activities.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateTransactionAndRelatedActivities() {
    const oThis = this;

    await oThis.validateTransfers();
    const promiseArray1 = [],
      promiseArray2 = [];

    promiseArray1.push(oThis.updateTransaction());
    promiseArray1.push(oThis.removeEntryFromPendingTransactions());

    await Promise.all(promiseArray1);

    promiseArray2.push(oThis._sendUserTransactionNotification());

    await Promise.all(promiseArray2);
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
        notificationJobEnqueue.enqueue(notificationJobConstants.videoTxSendSuccess, {
          transaction: oThis.transactionObj,
          videoId: oThis.videoId
        })
      );

      promisesArray.push(
        notificationJobEnqueue.enqueue(notificationJobConstants.videoTxReceiveSuccess, {
          transaction: oThis.transactionObj,
          videoId: oThis.videoId
        })
      );
    } else {
      promisesArray.push(
        notificationJobEnqueue.enqueue(notificationJobConstants.profileTxSendSuccess, {
          transaction: oThis.transactionObj
        })
      );

      promisesArray.push(
        notificationJobEnqueue.enqueue(notificationJobConstants.profileTxReceiveSuccess, {
          transaction: oThis.transactionObj
        })
      );
    }

    if (oThis.isPaperPlane) {
      promisesArray.push(
        notificationJobEnqueue.enqueue(notificationJobConstants.paperPlaneTransaction, {
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
}

module.exports = PepoOnReplySuccessTransaction;
