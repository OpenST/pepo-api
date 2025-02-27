const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedQuoteCurrencies;

/**
 * Class for Ost price points.
 *
 * @class OstPricePoints
 */
class OstPricePoints {
  get usdQuoteCurrency() {
    return 'USD';
  }

  get eurQuoteCurrency() {
    return 'EUR';
  }

  get gbpQuoteCurrency() {
    return 'GBP';
  }

  get quoteCurrencies() {
    const oThis = this;

    return {
      '1': oThis.usdQuoteCurrency,
      '2': oThis.eurQuoteCurrency,
      '3': oThis.gbpQuoteCurrency
    };
  }

  get invertedQuoteCurrencies() {
    const oThis = this;

    invertedQuoteCurrencies = invertedQuoteCurrencies || util.invert(oThis.quoteCurrencies);

    return invertedQuoteCurrencies;
  }

  get stakeCurrency() {
    return 'OST';
  }
}

module.exports = new OstPricePoints();
