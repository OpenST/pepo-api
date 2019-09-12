const rootPrefix = '../../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class ProductsSingleFormatter extends BaseFormatter {
  /**
   * Constructor for ProductsSingle formatter.
   *
   * @param {object} params
   * @param {object} params.product
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.product = params.product;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const ostPricePointKeyConfig = {
      id: { isNullAllowed: false },
      amount_in_usd: { isNullAllowed: false },
      amount_in_pepo: { isNullAllowed: false },
      uts: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.product, ostPricePointKeyConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {object|result}
   */
  _format() {
    const oThis = this;

    return responseHelper.successWithData({
      id: oThis.product.id,
      amount_in_usd: oThis.product.amount_in_usd,
      amount_in_pepo: oThis.product.amount_in_pepo,
      uts: oThis.product.uts
    });
  }
}

module.exports = ProductsSingleFormatter;
