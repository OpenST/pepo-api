const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class PricePointSingleFormatter extends BaseFormatter {
  /**
   * Constructor for PricePointSingleFormatter formatter.
   *
   * @param {object} params
   * @param {object} params.pricePoint
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.pricePoint = params.pricePoint;
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
      USD: { isNullAllowed: false },
      EUR: { isNullAllowed: false },
      GBP: { isNullAllowed: false },
      decimals: { isNullAllowed: false }
    };

    return oThis._validateParameters(oThis.pricePoint, ostPricePointKeyConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {object|result}
   */
  _format() {
    const oThis = this;

    return responseHelper.successWithData({
      USD: oThis.pricePoint.USD,
      EUR: oThis.pricePoint.EUR,
      GBP: oThis.pricePoint.GBP,
      decimals: oThis.pricePoint.decimals
    });
  }
}

module.exports = PricePointSingleFormatter;
