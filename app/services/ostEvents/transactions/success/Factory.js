const rootPrefix = '../../../../..',
  AirdropSuccessWebhook = require(rootPrefix + '/app/services/ostEvents/transactions/success/Airdrop'),
  PepoOnReplySuccessWebhook = require(rootPrefix + '/app/services/ostEvents/transactions/success/PepoOnReply'),
  RedemptionSuccessWebhook = require(rootPrefix + '/app/services/ostEvents/transactions/success/Redemption'),
  ReplyOnVideoSuccessWebhook = require(rootPrefix + '/app/services/ostEvents/transactions/success/ReplyOnVideo'),
  TopUpSuccessWebhook = require(rootPrefix + '/app/services/ostEvents/transactions/success/Topup'),
  UserTransactionSuccessWebhook = require(rootPrefix + '/app/services/ostEvents/transactions/success/UserTransaction'),
  TransactionWebhookFactoryBase = require(rootPrefix + '/app/services/ostEvents/transactions/FactoryBase'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  transactionConstants = require(rootPrefix + '/lib/globalConstant/transaction');

/**
 * Class for success transaction ost event base service.
 *
 * @class TransactionWebhookSuccessFactory
 */
class TransactionWebhookSuccessFactory extends TransactionWebhookFactoryBase {
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
      transactionEventResponse = new RedemptionSuccessWebhook({
        params: oThis.webhookData
      }).perform();
    } else if (oThis._isReplyOnVideoTransactionKind()) {
      transactionEventResponse = new ReplyOnVideoSuccessWebhook({
        params: oThis.webhookData
      }).perform();
    } else if (oThis._isPepoOnReplyTransactionKind()) {
      transactionEventResponse = new PepoOnReplySuccessWebhook({
        params: oThis.webhookData
      }).perform();
    } else if (oThis._isUserActivateAirdropTransactionKind()) {
      transactionEventResponse = new AirdropSuccessWebhook({
        params: oThis.webhookData
      }).perform();
    } else if (oThis._isTopUpTransactionKind()) {
      transactionEventResponse = new TopUpSuccessWebhook({
        params: oThis.webhookData
      }).perform();
    } else if (oThis._isUserTransactionKind()) {
      transactionEventResponse = new UserTransactionSuccessWebhook({
        params: oThis.webhookData
      }).perform();
    } else {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_oe_t_s_pt_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: oThis.transactionObj
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
    return transactionConstants.successOstTransactionStatus;
  }
}

module.exports = TransactionWebhookSuccessFactory;
