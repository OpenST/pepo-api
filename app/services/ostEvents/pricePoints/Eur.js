const rootPrefix = '../../../..',
  OstPricePointsUpdateBase = require(rootPrefix + '/app/services/ostEvents/pricePoints/Base'),
  ostPricePointsConstants = require(rootPrefix + '/lib/globalConstant/ostPricePoints');

/**
 * Class to update eur price points in ost price points table.
 *
 * @class EurPricePointsUpdate
 */
class EurPricePointsUpdate extends OstPricePointsUpdateBase {
  /**
   * Returns quote currency which needs to be updated.
   *
   * @returns {string}
   */
  get quoteCurrency() {
    return ostPricePointsConstants.eurQuoteCurrency;
  }
}

module.exports = EurPricePointsUpdate;
