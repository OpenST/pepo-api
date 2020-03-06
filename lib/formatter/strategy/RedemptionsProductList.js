const rootPrefix = '../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for redemptions product list formatter.
 *
 * @class RedemptionsProductList
 */
class RedemptionsProductList extends BaseFormatter {
  /**
   * Constructor for redemptions product list formatter.
   *
   * @param {object} params
   * @param {array<object>} params.redemptionsProductList.redemptionProducts
   * @param {string} params.redemptionsProductList.balance
   * @param {string} params.redemptionsProductList.pepocornBalance
   * @param {object} params.redemptionsProductList.pricePoints
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.redemptionsProductList = params.redemptionsProductList;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const redemptionsProductListConfig = {
      redemptionProducts: { isNullAllowed: false },
      balance: { isNullAllowed: false },
      pepocornBalance: { isNullAllowed: false },
      pricePoints: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.redemptionsProductList, redemptionsProductListConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {object}
   * @private
   */
  _format() {
    const oThis = this;

    return responseHelper.successWithData({
      redemption_products: oThis.redemptionsProductList.redemptionProducts,
      balance: oThis.redemptionsProductList.balance,
      pepocorn_balance: oThis.redemptionsProductList.pepocornBalance,
      price_points: oThis.redemptionsProductList.pricePoints
    });
  }
}

module.exports = RedemptionsProductList;
