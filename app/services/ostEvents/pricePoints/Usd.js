const rootPrefix = '../../../..',
  OstPricePointsUpdateBase = require(rootPrefix + '/app/services/ostEvents/pricePoints/Base'),
  ostPricePointsConstants = require(rootPrefix + '/lib/globalConstant/ostPricePoints');

/**
 * Class to update usd price points in ost price points table.
 *
 * @class UsdPricePointsUpdate
 */
class UsdPricePointsUpdate extends OstPricePointsUpdateBase {
  /**
   * Returns quote currency which needs to be updated.
   *
   * @returns {string}
   */
  get quoteCurrency() {
    return ostPricePointsConstants.usdQuoteCurrency;
  }
}

module.exports = UsdPricePointsUpdate;
