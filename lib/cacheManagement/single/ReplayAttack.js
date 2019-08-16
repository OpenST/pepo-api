'use strict';

/*
 * This cache checks if the signature is already used in the last 1 minute
 */

const rootPrefix = '../../..',
  MemcachedProvider = require(rootPrefix + '/lib/providers/memcached'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  apiVersions = require(rootPrefix + '/lib/globalConstant/apiVersions'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement');

const errorConfig = basicHelper.fetchErrorConfig(apiVersions.v1);

class ReplayAttackCache {
  /**
   * @constructor
   *
   * @param params
   * @param params.authKey {String}
   */
  constructor(params) {
    const oThis = this;

    oThis.cacheType = cacheManagementConst.memcached;
    oThis.authKey = params.authKey;

    // Call sub class method to set cache key using params provided
    oThis._setCacheKey();

    // Call sub class method to set cache expiry using params provided
    oThis._setCacheExpiry();
  }

  /**
   * Set cache key
   *
   * @return {String}
   */
  _setCacheKey() {
    const oThis = this;

    oThis.cacheKey = cacheManagementConst.keyPrefix + '_r_a_' + oThis.authKey;

    return oThis.cacheKey;
  }

  /**
   * Set cache expiry in oThis.cacheExpiry and return it.
   *
   * @sets oThis.cacheExpiry
   *
   * @return {number}
   */
  _setCacheExpiry() {
    const oThis = this;

    oThis.cacheExpiry = cacheManagementConst.verySmallExpiryTimeInterval;

    return oThis.cacheExpiry;
  }

  /**
   * Set cache implementer in oThis.cacheExpiry and return it
   *
   * @returns {Number}
   */
  async _setCacheImplementer() {
    const oThis = this;

    let cacheObject = await MemcachedProvider.getInstance(oThis.consistentBehavior);

    // Set cacheImplementer to perform caching operations
    oThis.cacheImplementer = cacheObject.cacheInstance;
  }

  /**
   * Set data in cache.
   *
   * @param {Object} dataToSet: data to set in cache
   * @returns {Result}
   */
  _setCache(dataToSet) {
    const oThis = this;

    let setCacheFunction = function() {
      return oThis.cacheImplementer.set(oThis.cacheKey, dataToSet, oThis.cacheExpiry);
    };

    setCacheFunction().then(function(cacheSetResponse) {
      if (cacheSetResponse.isFailure()) {
        logger.error('l_cm_s_ra_1', 'Something Went Wrong', cacheSetResponse);
      }
    });
  }

  /**
   * Fetch from cache
   *
   * @returns {Object}
   */
  async _fetchFromCache() {
    const oThis = this;

    let cacheData;

    let cacheFetchResponse = await oThis.cacheImplementer.get(oThis.cacheKey);

    if (cacheFetchResponse.isSuccess()) {
      cacheData = cacheFetchResponse.data.response;
    }

    return cacheData;
  }

  /**
   * Fetch from cache
   *
   * @return {Promise<*|result>}
   */
  async fetch() {
    const oThis = this;

    // Call sub class method to set cache implementer using params provided
    await oThis._setCacheImplementer();

    logger.debug('CACHE-FETCH## lib/cacheManagement/shared/ReplayAttack cache key: ', oThis.cacheKey);

    let data = await oThis._fetchFromCache();

    // if cache miss call sub class method to fetch data from source and set cache
    if (data) {
      return responseHelper.error({
        internal_error_identifier: 'l_cm_s_ra_2',
        api_error_identifier: 'invalid_signature',
        debug_options: {
          signature: oThis.signature
        }
      });
    }

    // DO NOT WAIT for cache being set
    oThis._setCache(1);
    return responseHelper.successWithData(data);
  }

  /**
   * Delete the cache entry
   *
   * @returns {Promise<*>}
   */
  async clear() {
    const oThis = this;

    return oThis.cacheImplementer.del(oThis.cacheKey);
  }
}

module.exports = ReplayAttackCache;
