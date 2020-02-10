const rootPrefix = '../../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  TopupProductSingleFormatter = require(rootPrefix + '/lib/formatter/strategy/topup/product/Single'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType');

class TopupProductListFormatter extends BaseFormatter {
  /**
   * Constructor for  products list formatter.
   *
   * @param {object} params
   * @param {array} params.products
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.products = params[entityTypeConstants.topupProducts];
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    if (!CommonValidators.validateArray(oThis.products)) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_s_p_l_1',
        api_error_identifier: 'entity_formatting_failed',
        debug_options: { array: oThis.products }
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

    const finalResponse = [];

    for (let index = 0; index < oThis.products.length; index++) {
      const product = oThis.products[index];

      const formattedProduct = new TopupProductSingleFormatter({
        [entityTypeConstants.topupProduct]: product
      }).perform();

      if (formattedProduct.isFailure()) {
        return formattedProduct;
      }

      finalResponse.push(formattedProduct.data);
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = TopupProductListFormatter;
