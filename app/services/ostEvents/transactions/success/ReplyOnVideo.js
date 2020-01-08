const rootPrefix = '../../../../..',
  UserStatModel = require(rootPrefix + '/app/models/mysql/UserStat'),
  UserStatByUserIds = require(rootPrefix + '/lib/cacheManagement/multi/UserStatByUserIds'),
  TransactionWebhookBase = require(rootPrefix + '/app/services/ostEvents/transactions/Base'),
  ReplyVideoPostTransaction = require(rootPrefix + '/lib/transaction/ReplyVideoPostTransaction'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  transactionConstants = require(rootPrefix + '/lib/globalConstant/transaction');

/**
 * Class for reply on video success transaction service.
 *
 * @class ReplyOnVideoSuccessWebhook
 */
class ReplyOnVideoSuccessWebhook extends TransactionWebhookBase {
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
        const promiseArray2 = [];
        //call lib
        promiseArray2.push(oThis.callReplyOnVideoPostTransactionLib());
        promiseArray2.push(oThis.updateUserStats());
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

    await oThis.validateTransfers();
    await oThis.updateTransaction();
    await oThis.updateUserStats();
  }

  /**
   * Update user stats. This method is used only for replyOnVideo transaction kind.
   *
   * @returns {Promise<void>}
   */
  async updateUserStats() {
    const oThis = this;

    const updateParams = {
      userId: oThis.fromUserId,
      totalContributedBy: 0,
      totalContributedTo: 0,
      totalAmountRaised: 0,
      totalAmountSpent: oThis.ostTransaction.transfers[0].amount
    };

    await UserStatModel.updateOrCreateUserStat(updateParams);

    // Flush cache.
    await new UserStatByUserIds({ userIds: [oThis.fromUserId] }).clear();
  }

  /**
   * Call reply on video post transaction lib
   *
   * @returns {Promise<never>}
   */
  async callReplyOnVideoPostTransactionLib() {
    const oThis = this;

    const replyVideoResponse = await new ReplyVideoPostTransaction({
      currentUserId: oThis.fromUserId,
      replyCreatorUserId: oThis.replyCreatorUserId,
      replyDetailId: oThis.replyDetailId,
      videoId: oThis.videoId,
      transactionId: oThis.ostTxId,
      pepoAmountInWei: oThis.ostTransaction.transfers[0].amount
    }).perform();

    if (replyVideoResponse.isFailure()) {
      return Promise.reject(replyVideoResponse);
    }
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

module.exports = ReplyOnVideoSuccessWebhook;
