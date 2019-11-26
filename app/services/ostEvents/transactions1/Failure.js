const rootPrefix = '../../../..',
  TransactionOstEventBase = require(rootPrefix + '/app/services/ostEvents/transactions/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
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

    if (oThis._isRedemptionTransactionKind()) {
    } else if (oThis._isReplyOnVideoTransactionKind()) {
    } else if (oThis._isPepoOnReplyTransactionKind()) {
    } else if (oThis._isUserActivateAirdropTransactionKind()) {
    } else if (oThis._isTopUpTransactionKind()) {
    } else if (oThis._isUserTransactionKind()) {
    } else {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_oe_t_s_pt_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: oThis.transactionObj
        })
      );
    }
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
