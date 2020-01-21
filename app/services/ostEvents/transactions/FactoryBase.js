const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  transactionConstants = require(rootPrefix + '/lib/globalConstant/transaction');

/**
 * Class for transaction event ost base.
 *
 * @class TransactionWebhookFactoryBase
 */
class TransactionWebhookFactoryBase extends ServiceBase {
  /**
   * Constructor for transaction event ost base.
   *
   * @param {object} params
   * @param {string} params.data: contains the webhook event data
   * @param {string} params.data.transaction: Transaction entity result from ost
   * @param {string} params.data.transaction.id
   * @param {string} params.data.transaction.status
   * @param {string} [params.data.transaction.block_timestamp]
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.webhookData = params.data;
    oThis.ostTransaction = params.data.transaction;
    oThis.ostTxId = oThis.ostTransaction.id;
    oThis.ostTransactionStatus = oThis.ostTransaction.status;
  }

  /**
   * Async performer.
   *
   * @return {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    throw new Error('Unimplemented method _asyncPerform for TransactionOstEvent.');
  }

  /**
   * Validate request.
   *
   * @return {Promise<void>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    logger.log('Start:: Validate for Transaction Webhook');
    const paramErrors = [];

    if (
      oThis._isUserTransactionKind() &&
      (oThis.ostTransaction.meta_property.name !== 'profile' && oThis.ostTransaction.meta_property.name !== 'video')
    ) {
      const errorObject = responseHelper.error({
        internal_error_identifier: 'a_s_oe_t_fb_vasp_1',
        api_error_identifier: 'something_went_wrong',
        debug_options: oThis.ostTransaction
      });

      await createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);
    }

    if (oThis.ostTransactionStatus !== oThis._validTransactionStatus()) {
      paramErrors.push('invalid_status');
    }

    if (paramErrors.length > 0) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_oe_t_fb_vasp_2',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: paramErrors,
          debug_options: {}
        })
      );
    }

    logger.log('End:: Validate for Transaction Webhook');
  }

  /**
   * Valid transaction status.
   *
   * @return {String}
   * @private
   */
  _validTransactionStatus() {
    throw new Error('Unimplemented method validTransactionStatus for TransactionOstEvent.');
  }

  /**
   * Return true if it is a pepocorn convert for redemption transaction.
   *
   * @returns {boolean}
   * @private
   */
  _isUserActivateAirdropTransactionKind() {
    const oThis = this;

    return oThis.ostTransaction.meta_property.name === transactionConstants.userActivateAirdropMetaName;
  }

  /**
   * Return true if it is a pepocorn convert for redemption transaction.
   *
   * @returns {boolean}
   * @private
   */
  _isTopUpTransactionKind() {
    const oThis = this;

    return oThis.ostTransaction.meta_property.name === transactionConstants.topUpMetaName;
  }

  /**
   * Return true if it is a pepocorn convert for redemption transaction.
   *
   * @returns {boolean}
   * @private
   */
  _isRedemptionTransactionKind() {
    const oThis = this;

    return oThis.ostTransaction.meta_property.name === transactionConstants.redemptionMetaName;
  }

  /**
   * Return true if it is reply on video transaction.
   *
   * @returns {boolean}
   * @private
   */
  _isReplyOnVideoTransactionKind() {
    const oThis = this;

    return oThis.ostTransaction.meta_property.name === transactionConstants.replyOnVideoMetaName;
  }

  /**
   * Return true if it is user-to-user transaction on a reply video.
   *
   * @returns {boolean}
   * @private
   */
  _isPepoOnReplyTransactionKind() {
    const oThis = this;

    return oThis.ostTransaction.meta_property.name === transactionConstants.pepoOnReplyMetaName;
  }

  /**
   * Return true if it is a pepocorn convert for redemption transaction.
   *
   * @returns {boolean}
   * @private
   */
  _isUserTransactionKind() {
    const oThis = this;

    return (
      !oThis._isUserActivateAirdropTransactionKind() &&
      !oThis._isTopUpTransactionKind() &&
      !oThis._isRedemptionTransactionKind() &&
      !oThis._isReplyOnVideoTransactionKind() &&
      !oThis._isPepoOnReplyTransactionKind() &&
      !oThis._isManualCompanyToUserTransaction()
    );
  }

  /**
   * Return true if it is a valid company-to-user transaction.
   *
   * @returns {boolean}
   * @private
   */
  _isManualCompanyToUserTransaction() {
    const oThis = this;

    const validManualCompanyToUserTransactionKinds = {
      [transactionConstants.referralBonusMetaName]: 1,
      [transactionConstants.manualMetaName]: 1
    };

    return validManualCompanyToUserTransactionKinds[oThis.ostTransaction.meta_property.name];
  }
}

module.exports = TransactionWebhookFactoryBase;
