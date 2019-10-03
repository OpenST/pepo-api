const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  PricePointsSingleFormatter = require(rootPrefix + '/lib/formatter/adminStrategy/pricePoints/Single'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class PricePointsMapFormatter extends BaseFormatter {
  /**
   * Constructor for ost transaction map formatter.
   *
   * @param {object} params
   * @param {object} params.pricePointsMap
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.pricePointsMap = params.pricePointsMap;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    if (!CommonValidators.validateObject(oThis.pricePointsMap)) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_as_pp_m_1',
        api_error_identifier: 'entity_formatting_failed',
        debug_options: { array: oThis.pricePointsMap }
      });
    }

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

    for (const stakeCurrency in oThis.pricePointsMap) {
      if (stakeCurrency !== 'OST') {
        return responseHelper.error({
          internal_error_identifier: 'l_f_as_pp_m_2',
          api_error_identifier: 'entity_formatting_failed',
          debug_options: { stakeCurrency: stakeCurrency }
        });
      }

      const pricePoint = oThis.pricePointsMap[stakeCurrency],
        formattedPricePoint = new PricePointsSingleFormatter({ pricePoint: pricePoint }).perform();

      if (formattedPricePoint.isFailure()) {
        return formattedPricePoint;
      }

      finalResponse[stakeCurrency] = formattedPricePoint.data;
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = PricePointsMapFormatter;
