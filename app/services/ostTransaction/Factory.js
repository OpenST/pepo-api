const rootPrefix = '../../..',
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  transactionConstants = require(rootPrefix + '/lib/globalConstant/transaction');

/**
 * Class for OstTransactionFactory.
 *
 * @class OstTransactionFactory
 */
class OstTransactionFactory {
  /**
   * Get OstTransactionFactory instance.
   *
   * @param {object} params
   */

  constructor(params) {
    const oThis = this;
    oThis.params = params;
  }

  async perform() {
    const oThis = this;

    if (!oThis.params.ost_transaction.meta_property || !oThis.params.ost_transaction.meta_property.name) {
      return responseHelper.paramValidationError({
        internal_error_identifier: 'a_s_ot_f_2',
        api_error_identifier: 'invalid_api_params',
        params_error_identifiers: ['invalid_meta'],
        debug_options: {}
      });
    }
    const metaPropertyName = oThis.params.ost_transaction.meta_property.name;

    switch (metaPropertyName) {
      case transactionConstants.redemptionMetaName: {
        return new oThis._redemptionTransaction(oThis.params).perform();
      }
      case transactionConstants.replyOnVideoMetaName: {
        return new oThis._replyOnVideoTransaction(oThis.params).perform();
      }
      case transactionConstants.pepoOnReplyMetaName: {
        return new oThis._pepoOnReplyTransaction(oThis.params).perform();
      }
      default: {
        // User transaction kind.
        return new oThis._userTransaction(oThis.params).perform();
      }
    }
  }

  get _redemptionTransaction() {
    return require(rootPrefix + '/app/services/ostTransaction/Redemption');
  }

  get _replyOnVideoTransaction() {
    return require(rootPrefix + '/app/services/ostTransaction/ReplyOnVideo');
  }

  get _pepoOnReplyTransaction() {
    return require(rootPrefix + '/app/services/ostTransaction/PepoOnReply');
  }

  get _userTransaction() {
    return require(rootPrefix + '/app/services/ostTransaction/UserTransaction');
  }
}

module.exports = OstTransactionFactory;
