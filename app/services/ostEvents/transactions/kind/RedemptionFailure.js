const rootPrefix = '../../../..',
  TransactionKindBase = require(rootPrefix + '/app/services/ostEvents/transactions/kind/Base'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  transactionConstants = require(rootPrefix + '/lib/globalConstant/transaction'),
  notificationJobEnqueue = require(rootPrefix + '/lib/rabbitMqEnqueue/notification'),
  notificationJobConstants = require(rootPrefix + '/lib/globalConstant/notificationJob'),
  pepocornTransactionConstants = require(rootPrefix + '/lib/globalConstant/redemption/pepocornTransaction');

/**
 * Class for redemption failure transaction service.
 *
 * @class RedemptionFailureTransactionKind
 */
class RedemptionFailureTransactionKind extends TransactionKindBase {
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

    promiseArray.push(oThis._validateToUserIdForRedemption());
    promiseArray.push(oThis._validateTransactionDataForRedemption());

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
        await oThis._insertInPepocornTransactions();
        await oThis._enqueueRedemptionNotification();
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

    await oThis.validateTransfers();

    const promiseArray = [];
    promiseArray.push(oThis.updateTransaction());
    promiseArray.push(oThis.updatePepocornTransactionModel());
    await Promise.all(promiseArray);
    await oThis._enqueueRedemptionNotification();
  }

  /**
   * Enqueue Redemption notification.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _enqueueRedemptionNotification(topic) {
    const oThis = this;

    return notificationJobEnqueue.enqueue(notificationJobConstants.creditPepocornFailure, {
      pepocornAmount: oThis.pepocornAmount,
      transaction: oThis.transactionObj
    });
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

  _getPepocornTransactionStatus() {
    const oThis = this;

    //whatever be the case it will be completetly failed
    return pepocornTransactionConstants.completelyFailedStatus;
  }
}

module.exports = RedemptionFailureTransactionKind;
