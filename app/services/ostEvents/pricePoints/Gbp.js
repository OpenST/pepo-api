const rootPrefix = '../../../..',
  OstPricePointsUpdateBase = require(rootPrefix + '/app/services/ostEvents/pricePoints/Base'),
  ostPricePointsConstants = require(rootPrefix + '/lib/globalConstant/ostPricePoints');

/**
 * Class to update gbp price points in ost price points table.
 *
 * @class GbpPricePointsUpdate
 */
class GbpPricePointsUpdate extends OstPricePointsUpdateBase {
  /**
   * Returns quote currency which needs to be updated.
   *
   * @returns {string}
   */
  get quoteCurrency() {
    return ostPricePointsConstants.gbpQuoteCurrency;
  }
}

module.exports = GbpPricePointsUpdate;
