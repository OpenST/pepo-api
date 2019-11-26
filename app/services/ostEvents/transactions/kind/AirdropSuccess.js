const rootPrefix = '../../../..',
  UpdateStats = require(rootPrefix + '/lib/UpdateStats'),
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
  PepocornBalanceModel = require(rootPrefix + '/app/models/mysql/PepocornBalance'),
  TransactionKindBase = require(rootPrefix + '/app/services/ostEvents/transactions/kind/Base'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  tokenUserConstants = require(rootPrefix + '/lib/globalConstant/tokenUser'),
  transactionConstants = require(rootPrefix + '/lib/globalConstant/transaction'),
  notificationJobEnqueue = require(rootPrefix + '/lib/rabbitMqEnqueue/notification'),
  notificationJobConstants = require(rootPrefix + '/lib/globalConstant/notificationJob');

/**
 * Class for airdrop success transaction service.
 *
 * @class AirdropSuccessTransactionKind
 */
class AirdropSuccessTransactionKind extends TransactionKindBase {
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

    if (oThis.isVideoIdPresent()) {
      promiseArray.push(oThis.fetchVideoAndValidate());
    }

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
        const promiseArray2 = [];
        promiseArray2.push(oThis._sendUserTransactionNotification());
        promiseArray2.push(oThis._updateStats());
        await Promise.all(promiseArray2);
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
            let errorObject = responseHelper.error({
              internal_error_identifier: 'a_s_oe_t_s_cpcb_1',
              api_error_identifier: 'something_went_wrong',
              debug_options: {
                reason: 'PepocornBalanceModel not updated for given user id.',
                userId: oThis.fromUserId,
                pepocornAmount: oThis.pepocornAmount
              }
            });
            createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);
            return Promise.reject(errorObject);
          }
        });
    }

    await PepocornBalanceModel.flushCache({
      userId: oThis.fromUserId
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

    await oThis.validateToUserId();
    const promiseArray = [];
    promiseArray.push(oThis.updateTransaction());
    promiseArray.push(oThis.processForAirdropTransaction());
    // TODO: USE AWAIT
    promiseArray.push(oThis._enqueueUserNotification(notificationJobConstants.airdropDone));
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
   * Update stats after transaction.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateStats() {
    const oThis = this;

    const updateStatsParams = {
      fromUserId: oThis.fromUserId,
      toUserId: oThis.toUserId,
      totalAmount: oThis.ostTransaction.transfers[0].amount
    };

    if (oThis.isVideoIdPresent()) {
      updateStatsParams.videoId = oThis.videoId;
    }

    if (oThis.isReplyDetailIdPresent()) {
      updateStatsParams.replyDetailId = oThis.replyDetailId;
    }

    const updateStatsObj = new UpdateStats(updateStatsParams);

    await updateStatsObj.perform();
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

  /**
   * Get new property value for token user.
   *
   * @param {number} propertyVal
   *
   * @returns {number}
   * @private
   */
  _getPropertyValForTokenUser(propertyVal) {
    logger.log('Get PropertyVal for Transaction Success Webhook.');

    propertyVal = new TokenUserModel().setBitwise('properties', propertyVal, tokenUserConstants.airdropDoneProperty);

    return propertyVal;
  }
}

module.exports = AirdropSuccessTransactionKind;
