const rootPrefix = '../../../../..',
  TransactionWebhookBase = require(rootPrefix + '/app/services/ostEvents/transactions/Base'),
  PepocornBalanceModel = require(rootPrefix + '/app/models/mysql/redemption/PepocornBalance'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  transactionConstants = require(rootPrefix + '/lib/globalConstant/transaction'),
  notificationJobEnqueue = require(rootPrefix + '/lib/rabbitMqEnqueue/notification'),
  notificationJobConstants = require(rootPrefix + '/lib/globalConstant/notificationJob'),
  pepocornTransactionConstants = require(rootPrefix + '/lib/globalConstant/redemption/pepocornTransaction');

/**
 * Class for redemption success transaction service.
 *
 * @class RedemptionSuccessWebhook
 */
class RedemptionSuccessWebhook extends TransactionWebhookBase {
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

    promiseArray.push(oThis._validateToUserIdForRedemption());
    promiseArray.push(oThis._validateTransactionDataForRedemption());

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
        await oThis._insertInPepocornTransactions();
        await oThis._creditPepoCornBalance();
        await oThis._enqueueRedemptionNotification();
      }
    }

    logger.log('Transaction Obj after receiving webhook: ', oThis.transactionObj);

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Add PepoCornBalance for User.
   *
   * @returns {Promise<any>}
   * @private
   */
  async _creditPepoCornBalance() {
    const oThis = this;

    if (!oThis.isValidRedemption) {
      return;
    }

    const updateResponse = await new PepocornBalanceModel()
      .update(['balance = balance + ?', oThis.pepocornAmount])
      .where({ user_id: oThis.fromUserId })
      .fire();

    if (updateResponse.affectedRows === 0) {
      await new PepocornBalanceModel()
        .insert({
          user_id: oThis.fromUserId,
          balance: oThis.pepocornAmount
        })
        .fire()
        .catch(async function(err) {
          if (PepocornBalanceModel.isDuplicateIndexViolation(PepocornBalanceModel.userIdUniqueIndexName, err)) {
            await new PepocornBalanceModel()
              .update(['balance = balance + ?', oThis.pepocornAmount])
              .where({ user_id: oThis.fromUserId })
              .fire();
          } else {
            const errorObject = responseHelper.error({
              internal_error_identifier: 'a_s_oe_t_s_cpcb_1',
              api_error_identifier: 'something_went_wrong',
              debug_options: {
                reason: 'PepocornBalanceModel not updated for given user id.',
                userId: oThis.fromUserId,
                pepocornAmount: oThis.pepocornAmount
              }
            });
            await createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);

            return Promise.reject(errorObject);
          }
        });
    }

    await PepocornBalanceModel.flushCache({
      userIds: [oThis.fromUserId]
    });
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

    await oThis.validateTransfers();
    await Promise.all([oThis.updateTransaction(), oThis.updatePepocornTransactionModel()]);
    await oThis._creditPepoCornBalance();
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

    if (!oThis.isValidRedemption) {
      return;
    }

    return notificationJobEnqueue.enqueue(notificationJobConstants.creditPepocornSuccess, {
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

  _getPepocornTransactionStatus() {
    const oThis = this;

    return oThis.isValidRedemption
      ? pepocornTransactionConstants.processedStatus
      : pepocornTransactionConstants.failedStatus;
  }
}

module.exports = RedemptionSuccessWebhook;
