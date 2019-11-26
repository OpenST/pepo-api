const rootPrefix = '../../../..',
  AirdropSuccessClass = require(rootPrefix + '/app/services/ostEvents/transactions/kind/AirdropSuccess'),
  PepoOnReplySuccessClass = require(rootPrefix + '/app/services/ostEvents/transactions/kind/PepoOnReplySuccess'),
  RedemptionSuccessClass = require(rootPrefix + '/app/services/ostEvents/transactions/kind/RedemptionSuccess'),
  ReplyOnVideoSuccessClass = require(rootPrefix + '/app/services/ostEvents/transactions/kind/ReplyOnVideoSuccess'),
  TopUpSuccessClass = require(rootPrefix + '/app/services/ostEvents/transactions/kind/TopUpSuccess'),
  UserTransactionSuccessClass = require(rootPrefix +
    '/app/services/ostEvents/transactions/kind/UserTransactionSuccess'),
  TransactionOstEventBase = require(rootPrefix + '/app/services/ostEvents/transactions/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  transactionConstants = require(rootPrefix + '/lib/globalConstant/transaction');

/**
 * Class for success transaction ost event base service.
 *
 * @class SuccessTransactionOstEvent
 */
class SuccessTransactionOstEvent extends TransactionOstEventBase {
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
      transactionEventResponse = new RedemptionSuccessClass({
        params: oThis.webhookData
      }).perform();
    } else if (oThis._isReplyOnVideoTransactionKind()) {
      transactionEventResponse = new ReplyOnVideoSuccessClass({
        params: oThis.webhookData
      }).perform();
    } else if (oThis._isPepoOnReplyTransactionKind()) {
      transactionEventResponse = new PepoOnReplySuccessClass({
        params: oThis.webhookData
      }).perform();
    } else if (oThis._isUserActivateAirdropTransactionKind()) {
      transactionEventResponse = new AirdropSuccessClass({
        params: oThis.webhookData
      }).perform();
    } else if (oThis._isTopUpTransactionKind()) {
      transactionEventResponse = new TopUpSuccessClass({
        params: oThis.webhookData
      }).perform();
    } else if (oThis._isUserTransactionKind()) {
      transactionEventResponse = new UserTransactionSuccessClass({
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

module.exports = SuccessTransactionOstEvent;
