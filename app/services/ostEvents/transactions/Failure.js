const rootPrefix = '../../../..',
  TransactionOstEventBase = require(rootPrefix + '/app/services/ostEvents/transactions/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  AirdropFailureClass = require(rootPrefix + '/app/services/ostEvents/transactions/kind/AirdropFailure'),
  PepoOnReplyFailureClass = require(rootPrefix + '/app/services/ostEvents/transactions/kind/PepoOnReplyFailure'),
  RedemptionFailureClass = require(rootPrefix + '/app/services/ostEvents/transactions/kind/RedemptionFailure'),
  ReplyOnVideoFailureClass = require(rootPrefix + '/app/services/ostEvents/transactions/kind/ReplyOnVideoFailure'),
  TopUpFailureClass = require(rootPrefix + '/app/services/ostEvents/transactions/kind/TopUpFailure'),
  UserTransactionFailureClass = require(rootPrefix +
    '/app/services/ostEvents/transactions/kind/UserTransactionFailure'),
  transactionConstants = require(rootPrefix + '/lib/globalConstant/transaction');

/**
 * Class for failure transaction ost event base service.
 *
 * @class FailureTransactionOstEvent
 */
class FailureTransactionOstEvent extends TransactionOstEventBase {
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
      transactionEventResponse = new RedemptionFailureClass({
        params: oThis.webhookData
      }).perform();
    } else if (oThis._isReplyOnVideoTransactionKind()) {
      transactionEventResponse = new ReplyOnVideoFailureClass({
        params: oThis.webhookData
      }).perform();
    } else if (oThis._isPepoOnReplyTransactionKind()) {
      transactionEventResponse = new PepoOnReplyFailureClass({
        params: oThis.webhookData
      }).perform();
    } else if (oThis._isUserActivateAirdropTransactionKind()) {
      transactionEventResponse = new AirdropFailureClass({
        params: oThis.webhookData
      }).perform();
    } else if (oThis.TopUpFailureClass()) {
      transactionEventResponse = new TopUpFailureClass({
        params: oThis.webhookData
      }).perform();
    } else if (oThis._isUserTransactionKind()) {
      transactionEventResponse = new UserTransactionFailureClass({
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
    return transactionConstants.failedOstTransactionStatus;
  }
}

module.exports = FailureTransactionOstEvent;
