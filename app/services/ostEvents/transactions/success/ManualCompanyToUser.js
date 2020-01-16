const rootPrefix = '../../../../..',
  TransactionWebhookBase = require(rootPrefix + '/app/services/ostEvents/transactions/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  transactionConstants = require(rootPrefix + '/lib/globalConstant/transaction'),
  transactionTypesConstants = require(rootPrefix + '/lib/globalConstant/transactionTypes');

/**
 * Class for manual company to user success transaction service.
 *
 * @class ManualCompanyToUser
 */
class ManualCompanyToUser extends TransactionWebhookBase {
  /**
   * Async perform.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    const promiseArray = [oThis.fetchTransaction(), oThis.setFromAndToUserId()];
    await Promise.all(promiseArray);

    if (oThis.transactionObj) {
      // Transaction is found in db. All updates happen in this block.
      await oThis._processTransaction();
    } else {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_oe_t_s_mctu_1',
          api_error_identifier: 'invalid_api_params',
          debug_options: oThis.ostTransaction
        })
      );
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
          internal_error_identifier: 'a_s_oe_t_s_mctu_2',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_transaction_type'],
          debug_options: { ostTransaction: oThis.ostTransaction }
        })
      );
    }
  }
}

module.exports = ManualCompanyToUser;
