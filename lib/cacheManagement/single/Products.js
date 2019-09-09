const rootPrefix = '../../..',
  TokenModel = require(rootPrefix + '/app/models/mysql/Token'),
  InAppProductsModel = require(rootPrefix + '/app/models/mysql/InAppProduct'),
  SecureTokenCache = require(rootPrefix + '/lib/cacheManagement/single/SecureToken.js'),
  CacheSingleBase = require(rootPrefix + '/lib/cacheManagement/single/Base'),
  OstPricePointCache = require(rootPrefix + '/lib/cacheManagement/single/PricePoints'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement'),
  ostPricePointsConstants = require(rootPrefix + '/lib/globalConstant/ostPricePoints');

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

    oThis.cacheType = cacheManagementConst.memcached;
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

    let promiseArray = [];
    promiseArray.push(oThis._fetchPricePoint());
    promiseArray.push(oThis._fetchTokenData());

    await Promise.all(promiseArray);

    let onePepoToHowManyOst = parseFloat(1 / oThis.ostToPepoConversionFactor),
      onePepoToHowManyUsd = onePepoToHowManyOst * oThis.ostToUsdPricePoint;

    let eligibleProductsForGivenPricePoint = await new InAppProductsModel().getProductsForGivenPricePoint(
        onePepoToHowManyUsd
      ),
      dataToCache = { products: eligibleProductsForGivenPricePoint };

    return responseHelper.successWithData(dataToCache);
  }

  /**
   * Fetch price point
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchPricePoint() {
    const oThis = this;

    let pricePointCacheResponse = await new OstPricePointCache().fetch();
    if (pricePointCacheResponse.isFailure()) {
      return Promise.reject(pricePointCacheResponse);
    }

    oThis.ostToUsdPricePoint = parseFloat(pricePointCacheResponse.data.OST.USD);
  }

  /**
   * Fetch token data
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchTokenData() {
    const oThis = this;

    let tokenDataCacheResponse = await new SecureTokenCache().fetch();
    if (tokenDataCacheResponse.isFailure()) {
      return Promise.reject(tokenDataCacheResponse);
    }

    oThis.ostToPepoConversionFactor = parseFloat(tokenDataCacheResponse.data.conversionFactor);
  }
}

module.exports = Products;
