const rootPrefix = '../../../../..',
  TopupFailureWebhook = require(rootPrefix + '/app/services/ostEvents/transactions/failure/Topup'),
  AirdropFailureWebhook = require(rootPrefix + '/app/services/ostEvents/transactions/failure/Airdrop'),
  TransactionWebhookFactoryBase = require(rootPrefix + '/app/services/ostEvents/transactions/FactoryBase'),
  RedemptionFailureWebhook = require(rootPrefix + '/app/services/ostEvents/transactions/failure/Redemption'),
  PepoOnReplyFailureWebhook = require(rootPrefix + '/app/services/ostEvents/transactions/failure/PepoOnReply'),
  ReplyOnVideoFailureWebhook = require(rootPrefix + '/app/services/ostEvents/transactions/failure/ReplyOnVideo'),
  UserTransactionFailureWebhook = require(rootPrefix + '/app/services/ostEvents/transactions/failure/UserTransaction'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
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

    let transactionEventResponse = null;
    if (oThis._isRedemptionTransactionKind()) {
      transactionEventResponse = new RedemptionFailureWebhook({
        params: oThis.webhookData
      }).perform();
    } else if (oThis._isReplyOnVideoTransactionKind()) {
      transactionEventResponse = new ReplyOnVideoFailureWebhook({
        params: oThis.webhookData
      }).perform();
    } else if (oThis._isPepoOnReplyTransactionKind()) {
      transactionEventResponse = new PepoOnReplyFailureWebhook({
        params: oThis.webhookData
      }).perform();
    } else if (oThis._isUserActivateAirdropTransactionKind()) {
      transactionEventResponse = new AirdropFailureWebhook({
        params: oThis.webhookData
      }).perform();
    } else if (oThis.TopUpFailureClass()) {
      transactionEventResponse = new TopupFailureWebhook({
        params: oThis.webhookData
      }).perform();
    } else if (oThis._isUserTransactionKind()) {
      transactionEventResponse = new UserTransactionFailureWebhook({
        params: oThis.webhookData
      }).perform();
    } else {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_oe_t_f_pt_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: oThis.webhookData
        })
      );
    }

    await transactionEventResponse;
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
