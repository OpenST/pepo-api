const rootPrefix = '../../..',
  MemcachedProvider = require(rootPrefix + '/lib/providers/memcached'),
  CacheSingleBase = require(rootPrefix + '/lib/cacheManagement/single/Base'),
  SecureTokenCache = require(rootPrefix + '/lib/cacheManagement/single/SecureToken'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  ostPlatformSdk = require(rootPrefix + '/lib/ostPlatform/jsSdkWrapper'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class to get price point.
 *
 * @class PrincePoints
 */
class PrincePoints extends CacheSingleBase {
  /**
   * Init params in oThis.
   *
   * @param {object} params
   *
   *
   *
   * @private
   */
  _initParams(params) {
    const oThis = this;
  }

  /**
   * Set use object
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

    oThis.cacheKey = `${oThis._cacheKeyPrefix()}_price_points_`;

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

    oThis.cacheExpiry = cacheManagementConst.smallExpiryTimeInterval;

    return oThis.cacheExpiry;
  }

  /**
   * Fetch data from source
   *
   * @return {Result}
   */
  async fetchDataFromSource() {
    const oThis = this;

    let secureTokenData = await new SecureTokenCache({}).fetch();

    if (secureTokenData.isFailure()) {
      return Promise.reject(secureTokenData);
    }

    let chainId = secureTokenData.data.auxChainId,
      pricePointsServiceResponse = await ostPlatformSdk.pricePoints({ chainId: chainId });
    if (!pricePointsServiceResponse.isSuccess()) {
      return Promise.reject(pricePointsServiceResponse);
    }

    return responseHelper.successWithData(pricePointsServiceResponse.data.price_point);
  }
}

module.exports = PrincePoints;
