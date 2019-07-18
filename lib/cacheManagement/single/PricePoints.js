const rootPrefix = '../../..',
  TokenModel = require(rootPrefix + '/app/models/mysql/Token'),
  MemcachedProvider = require(rootPrefix + '/lib/providers/memcached'),
  CacheSingleBase = require(rootPrefix + '/lib/cacheManagement/single/Base'),
  OstPricePointsModel = require(rootPrefix + '/app/models/mysql/OstPricePoints'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement'),
  ostPricePointsConstants = require(rootPrefix + '/lib/globalConstant/ostPricePoints');

/**
 * Class to get price point.
 *
 * @class PricePoints
 */
class PricePoints extends CacheSingleBase {
  /**
   * Init params in oThis.
   *
   * @private
   */
  _initParams() {
    // Do nothing.
  }

  /**
   * Set use object.
   *
   * @sets oThis.useObject
   *
   * @private
   */
  _setUseObject() {
    const oThis = this;

    oThis.useObject = true;
  }

  /**
   * Set cache type.
   *
   * @sets oThis.cacheType
   *
   * @returns {string}
   */
  _setCacheType() {
    const oThis = this;

    oThis.cacheType = cacheManagementConst.memcached;
  }

  /**
   * Set cache implementer in oThis.cacheImplementer.
   *
   * @returns {Promise<void>}
   */
  async _setCacheImplementer() {
    const oThis = this;

    if (oThis.cacheImplementer) {
      return;
    }

    let cacheObject = await MemcachedProvider.getInstance(oThis.consistentBehavior);

    // Set cacheImplementer to perform caching operations
    oThis.cacheImplementer = cacheObject.cacheInstance;
  }

  /**
   * Set cache key.
   *
   * @sets oThis.cacheKey
   *
   * @returns {string}
   */
  setCacheKey() {
    const oThis = this;

    oThis.cacheKey = `${oThis._cacheKeyPrefix()}_price_points`;

    return oThis.cacheKey;
  }

  /**
   * Set cache expiry in oThis.cacheExpiry and return it.
   *
   * @sets oThis.cacheExpiry
   *
   * @return {number}
   */
  setCacheExpiry() {
    const oThis = this;

    oThis.cacheExpiry = cacheManagementConst.mediumExpiryTimeInterval;

    return oThis.cacheExpiry;
  }

  /**
   * Fetch data from source
   *
   * @return {Result}
   */
  async fetchDataFromSource() {
    const oThis = this;

    const maxRetryCount = 10;

    const modelResponse = await new OstPricePointsModel().fetchLatestPricePointsForAllQuoteCurrencies();

    let finalQuoteCurrencyPricePoints = modelResponse.price_points;
    let quoteCurrenciesWithConversionRates = modelResponse.quoteCurrencies;
    let missingQuoteCurrencies = oThis.getMissingQuoteCurrencies(quoteCurrenciesWithConversionRates);
    let retryCount = 0;

    while (missingQuoteCurrencies.length > 0 && retryCount < maxRetryCount) {
      const specificQuoteCurrenciesResponse = await new OstPricePointsModel().fetchForQuoteCurrencies(
        missingQuoteCurrencies
      );

      quoteCurrenciesWithConversionRates = specificQuoteCurrenciesResponse.quoteCurrencies;

      for (const quoteCurrencyString in quoteCurrenciesWithConversionRates) {
        finalQuoteCurrencyPricePoints[quoteCurrencyString] =
          specificQuoteCurrenciesResponse.price_points[quoteCurrencyString];
      }

      missingQuoteCurrencies = oThis.getMissingQuoteCurrencies(
        quoteCurrenciesWithConversionRates,
        missingQuoteCurrencies
      );

      retryCount++;
    }

    if (retryCount === maxRetryCount) {
      return Promise.reject(
        new Error(
          `Max retry count reached for fetching quote currency price values. 
          Missing quote currencies are: ${missingQuoteCurrencies}`
        )
      );
    }

    const pepoTokenDetails = await oThis.fetchPepoTokenDetails();

    const finalResponse = {
      [pepoTokenDetails.stakeCurrency]: {
        decimals: pepoTokenDetails.decimals,
        [ostPricePointsConstants.usdQuoteCurrency]:
          finalQuoteCurrencyPricePoints[[ostPricePointsConstants.usdQuoteCurrency]],
        [ostPricePointsConstants.eurQuoteCurrency]:
          finalQuoteCurrencyPricePoints[[ostPricePointsConstants.eurQuoteCurrency]],
        [ostPricePointsConstants.gbpQuoteCurrency]:
          finalQuoteCurrencyPricePoints[[ostPricePointsConstants.gbpQuoteCurrency]]
      }
    };

    return responseHelper.successWithData(finalResponse);
  }

  /**
   * Get missing quote currencies array.
   *
   * @param {object} quoteCurrenciesWithConversionRates
   * @param {array} [existingMissingQuoteCurrencies]
   *
   * @returns {array}
   */
  getMissingQuoteCurrencies(quoteCurrenciesWithConversionRates, existingMissingQuoteCurrencies = []) {
    const missingQuoteCurrencies = [];

    if (existingMissingQuoteCurrencies.length > 0) {
      for (let index = 0; index < existingMissingQuoteCurrencies.length; index++) {
        const existingMissingQuoteCurrency = existingMissingQuoteCurrencies[index];

        if (!quoteCurrenciesWithConversionRates.hasOwnProperty(existingMissingQuoteCurrency)) {
          missingQuoteCurrencies.push(existingMissingQuoteCurrency);
        }
      }
    } else {
      for (const quoteCurrencyString in ostPricePointsConstants.invertedQuoteCurrencies) {
        if (!quoteCurrenciesWithConversionRates.hasOwnProperty(quoteCurrencyString)) {
          missingQuoteCurrencies.push(quoteCurrencyString);
        }
      }
    }

    return missingQuoteCurrencies;
  }

  /**
   * Fetch pepo token details.
   *
   * @returns {Promise<{stakeCurrency: string, decimals: number}>}
   */
  async fetchPepoTokenDetails() {
    const pepoTokenDetails = await new TokenModel().fetchToken();

    return {
      stakeCurrency: pepoTokenDetails.stakeCurrency,
      decimals: pepoTokenDetails.decimal
    };
  }
}

module.exports = PricePoints;
