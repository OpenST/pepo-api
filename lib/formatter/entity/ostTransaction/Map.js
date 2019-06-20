const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  OstTransactionSingleFormatter = require(rootPrefix + '/lib/formatter/entity/ostTransaction/Single'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for ost transaction map formatter.
 *
 * @class OstTransactionMapFormatter
 */
class OstTransactionMapFormatter extends BaseFormatter {
  /**
   * Constructor for ost transaction map formatter.
   *
   * @param {object} params
   * @param {object} params.ostTransactionMap
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.ostTransactionMap = params.ostTransactionMap;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    // if (!CommonValidators.validateObject(oThis.ostTransactionMap)) {
    //   return responseHelper.error({
    //     internal_error_identifier: 'l_f_e_ot_m_1',
    //     api_error_identifier: 'entity_formatting_failed',
    //     debug_options: { array: oThis.ostTransactionMap }
    //   });
    // }

    return responseHelper.successWithData({});
  }

  /**
   * Format the input object.
   *
   * @returns {result}
   * @private
   */
  _format() {
    const oThis = this;

    const finalResponse = {};

    for (const id in oThis.ostTransactionMap) {
      const ostTransactionObj = oThis.ostTransactionMap[id],
        formattedOstTransaction = new OstTransactionSingleFormatter({ ostTransaction: ostTransactionObj }).perform();

      if (formattedOstTransaction.isFailure()) {
        return formattedOstTransaction;
      }

      finalResponse[id] = formattedOstTransaction.data;
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = OstTransactionMapFormatter;
