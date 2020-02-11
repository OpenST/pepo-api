const rootPrefix = '../../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType');

class TopupProductSingleFormatter extends BaseFormatter {
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

    oThis.product = params[entityTypeConstants.topupProduct];
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
      amountInUsd: { isNullAllowed: false },
      pepoAmountInWei: { isNullAllowed: false },
      updatedAt: { isNullAllowed: false }
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
      amount_in_usd: oThis.product.amountInUsd,
      amount_in_pepo: oThis.product.pepoAmountInWei,
      uts: oThis.product.updatedAt
    });
  }
}

module.exports = TopupProductSingleFormatter;
