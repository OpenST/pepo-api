const BigNumber = require('bignumber.js');

const rootPrefix = '../../..',
  CacheSingleBase = require(rootPrefix + '/lib/cacheManagement/single/Base'),
  InAppProductModel = require(rootPrefix + '/app/models/mysql/fiat/InAppProduct'),
  SecureTokenCache = require(rootPrefix + '/lib/cacheManagement/single/SecureToken'),
  OstPricePointCache = require(rootPrefix + '/lib/cacheManagement/single/PricePoints'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cacheManagementConstants = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class to get products.
 *
 * @class products
 */
class Products extends CacheSingleBase {
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

    oThis.cacheType = cacheManagementConstants.memcached;
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

    oThis.cacheKey = `${oThis._cacheKeyPrefix()}_products`;

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

    oThis.cacheExpiry = cacheManagementConstants.mediumExpiryTimeInterval;

    return oThis.cacheExpiry;
  }

  /**
   * Fetch data from source
   *
   * @return {Result}
   */
  async fetchDataFromSource() {
    const oThis = this;

    await Promise.all([oThis._fetchPricePoint(), oThis._fetchTokenData()]);

    const ostAmountInOnePepoBn = new BigNumber(1).div(new BigNumber(oThis.ostToPepoConversionFactor)),
      onePepoValueInUsdBn = ostAmountInOnePepoBn.mul(new BigNumber(oThis.ostToUsdPricePoint));

    const eligibleProductsForGivenPricePoint = await new InAppProductModel().getProductsForGivenPricePoint(
        parseFloat(onePepoValueInUsdBn.round(2).toString(10))
      ),
      dataToCache = { products: eligibleProductsForGivenPricePoint };

    return responseHelper.successWithData(dataToCache);
  }

  /**
   * Fetch price point.
   *
   * @sets oThis.ostToUsdPricePoint
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchPricePoint() {
    const oThis = this;

    const pricePointCacheResponse = await new OstPricePointCache().fetch();
    if (pricePointCacheResponse.isFailure()) {
      return Promise.reject(pricePointCacheResponse);
    }

    oThis.ostToUsdPricePoint = parseFloat(pricePointCacheResponse.data.OST.USD);
  }

  /**
   * Fetch token data.
   *
   * @sets oThis.ostToPepoConversionFactor
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchTokenData() {
    const oThis = this;

    const tokenDataCacheResponse = await new SecureTokenCache().fetch();
    if (tokenDataCacheResponse.isFailure()) {
      return Promise.reject(tokenDataCacheResponse);
    }

    oThis.ostToPepoConversionFactor = parseFloat(tokenDataCacheResponse.data.conversionFactor);
  }
}

module.exports = Products;
