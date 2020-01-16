const rootPrefix = '../../../../..',
  TopUpSuccessWebhook = require(rootPrefix + '/app/services/ostEvents/transactions/success/Topup'),
  AirdropSuccessWebhook = require(rootPrefix + '/app/services/ostEvents/transactions/success/Airdrop'),
  TransactionWebhookFactoryBase = require(rootPrefix + '/app/services/ostEvents/transactions/FactoryBase'),
  RedemptionSuccessWebhook = require(rootPrefix + '/app/services/ostEvents/transactions/success/Redemption'),
  PepoOnReplySuccessWebhook = require(rootPrefix + '/app/services/ostEvents/transactions/success/PepoOnReply'),
  ReplyOnVideoSuccessWebhook = require(rootPrefix + '/app/services/ostEvents/transactions/success/ReplyOnVideo'),
  UserTransactionSuccessWebhook = require(rootPrefix + '/app/services/ostEvents/transactions/success/UserTransaction'),
  ManualCompanyToUserSuccessWebhook = require(rootPrefix +
    '/app/services/ostEvents/transactions/success/ManualCompanyToUser'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
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

    logger.log('====oThis.webhookData 11111111111 is : ', oThis.webhookData);

    let transactionEventResponse = null;
    if (oThis._isRedemptionTransactionKind()) {
      transactionEventResponse = await new RedemptionSuccessWebhook(oThis.webhookData).perform();
    } else if (oThis._isReplyOnVideoTransactionKind()) {
      transactionEventResponse = await new ReplyOnVideoSuccessWebhook(oThis.webhookData).perform();
    } else if (oThis._isPepoOnReplyTransactionKind()) {
      transactionEventResponse = await new PepoOnReplySuccessWebhook(oThis.webhookData).perform();
    } else if (oThis._isUserActivateAirdropTransactionKind()) {
      transactionEventResponse = await new AirdropSuccessWebhook(oThis.webhookData).perform();
    } else if (oThis._isTopUpTransactionKind()) {
      transactionEventResponse = await new TopUpSuccessWebhook(oThis.webhookData).perform();
    } else if (oThis._isManualCompanyToUserTransaction()) {
      transactionEventResponse = await new ManualCompanyToUserSuccessWebhook(oThis.webhookData).perform();
    } else if (oThis._isUserTransactionKind()) {
      transactionEventResponse = await new UserTransactionSuccessWebhook(oThis.webhookData).perform();
    } else {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_oe_t_s_f_pt_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: oThis.transactionObj
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
    return transactionConstants.successOstTransactionStatus;
  }
}

module.exports = TransactionWebhookSuccessFactory;
