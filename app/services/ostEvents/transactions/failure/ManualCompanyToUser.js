const rootPrefix = '../../../../..',
  TransactionWebhookBase = require(rootPrefix + '/app/services/ostEvents/transactions/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  transactionConstants = require(rootPrefix + '/lib/globalConstant/transaction'),
  transactionTypesConstants = require(rootPrefix + '/lib/globalConstant/transactionTypes');

/**
 * Class for manual company to user failure transaction service.
 *
 * @class ManualCompanyToUser
 */
class ManualCompanyToUser extends TransactionWebhookBase {
  /**
   * Async perform.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    const promiseArray = [oThis.fetchTransaction(), oThis.setFromAndToUserId()];
    await Promise.all(promiseArray);

    if (oThis.transactionObj) {
      await oThis._processTransaction();
    } else {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_oe_t_f_mctu_1',
          api_error_identifier: 'invalid_api_params',
          debug_options: oThis.ostTransaction
        })
      );
    }

    return responseHelper.successWithData({});
  }

  /**
   * Process transaction when transaction is found in database.
   *
   * @returns {Promise<any>}
   * @private
   */
  async _processTransaction() {
    const oThis = this;

    const response = await oThis.validateTransactionObj();

    if (response.isFailure()) {
      // Transaction status need not be changed.
      return responseHelper.successWithData({});
    }

    await oThis.validateToUserId();
    await oThis.validateTransactionType();
    await oThis.updateTransaction();
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

  /**
   * Transaction status.
   *
   * @returns {string}
   * @private
   */
  _transactionStatus() {
    return transactionConstants.failedStatus;
  }

  /**
   * Validate transaction type.
   *
   * @returns {Promise<never>}
   */
  async validateTransactionType() {
    const oThis = this;

    if (oThis.ostTransaction.meta_property.type !== transactionTypesConstants.companyToUserTransactionType) {
      logger.error('Invalid transaction type.');

      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_oe_t_f_mctu_2',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_transaction_type'],
          debug_options: { ostTransaction: oThis.ostTransaction }
        })
      );
    }
  }
}

module.exports = ManualCompanyToUser;
