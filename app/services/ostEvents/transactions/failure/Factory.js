const rootPrefix = '../../../../..',
  TopupFailureWebhook = require(rootPrefix + '/app/services/ostEvents/transactions/failure/Topup'),
  AirdropFailureWebhook = require(rootPrefix + '/app/services/ostEvents/transactions/failure/Airdrop'),
  TransactionWebhookFactoryBase = require(rootPrefix + '/app/services/ostEvents/transactions/FactoryBase'),
  RedemptionFailureWebhook = require(rootPrefix + '/app/services/ostEvents/transactions/failure/Redemption'),
  PepoOnReplyFailureWebhook = require(rootPrefix + '/app/services/ostEvents/transactions/failure/PepoOnReply'),
  ReplyOnVideoFailureWebhook = require(rootPrefix + '/app/services/ostEvents/transactions/failure/ReplyOnVideo'),
  UserTransactionFailureWebhook = require(rootPrefix + '/app/services/ostEvents/transactions/failure/UserTransaction'),
  ManualCompanyToUserFailureWebhook = require(rootPrefix +
    '/app/services/ostEvents/transactions/failure/ManualCompanyToUser'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  transactionConstant = require(rootPrefix + '/lib/globalConstant/transaction');

/**
 * Class for failure transaction ost event base service.
 *
 * @class TransactionWebhookFailureFactory
 */
class TransactionWebhookFailureFactory extends TransactionWebhookFactoryBase {
  /**
   * Async perform.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    await oThis._processTransaction();

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

    const errorObject = responseHelper.error({
      internal_error_identifier: 'a_s_oe_t_f_f_pt_1',
      api_error_identifier: 'something_went_wrong',
      debug_options: {
        Reason: 'Transaction failure.',
        ostTransaction: oThis.ostTransaction
      }
    });
    await createErrorLogsEntry.perform(errorObject, errorLogsConstants.mediumSeverity);

    let transactionEventResponse = null;
    if (oThis._isRedemptionTransactionKind()) {
      transactionEventResponse = await new RedemptionFailureWebhook(oThis.webhookData).perform();
    } else if (oThis._isReplyOnVideoTransactionKind()) {
      transactionEventResponse = await new ReplyOnVideoFailureWebhook(oThis.webhookData).perform();
    } else if (oThis._isPepoOnReplyTransactionKind()) {
      transactionEventResponse = await new PepoOnReplyFailureWebhook(oThis.webhookData).perform();
    } else if (oThis._isUserActivateAirdropTransactionKind()) {
      transactionEventResponse = await new AirdropFailureWebhook(oThis.webhookData).perform();
    } else if (oThis._isTopUpTransactionKind()) {
      transactionEventResponse = await new TopupFailureWebhook(oThis.webhookData).perform();
    } else if (oThis._isManualCompanyToUserTransaction()) {
      transactionEventResponse = await new ManualCompanyToUserFailureWebhook(oThis.webhookData).perform();
    } else if (oThis._isUserTransactionKind()) {
      transactionEventResponse = await new UserTransactionFailureWebhook(oThis.webhookData).perform();
    } else {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_oe_t_f_pt_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: oThis.webhookData
        })
      );
    }

    if (transactionEventResponse && transactionEventResponse.isFailure()) {
      return Promise.reject(transactionEventResponse);
    }

    responseHelper.successWithData({});
  }

  /**
   * Return transaction status.
   *
   * @return {string}
   * @private
   */
  _validTransactionStatus() {
    return transactionConstant.failedOstTransactionStatus;
  }
}

module.exports = TransactionWebhookFailureFactory;
