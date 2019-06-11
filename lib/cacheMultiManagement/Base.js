/**
 * Cache multi management base
 *
 * @module lib/cacheMultiManagement/Base
 */

const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  ErrorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  KmsWrapper = require(rootPrefix + '/lib/authentication/KmsWrapper'),
  MemcachedProvider = require(rootPrefix + '/lib/providers/memcached'),
  InMemoryCacheProvider = require(rootPrefix + '/lib/providers/inMemoryCache');

/**
 * Class for cache multi management base
 *
 * @class
 */
class CacheMultiManagementBase {
  /**
   * Constructor for cache multi management base
   *
   * @param {Object} params: cache key generation & expiry related params
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    if (!params) {
      params = {};
    }

    oThis.cacheExpiry = null;
    oThis.cacheKeys = {};
    oThis.invertedCacheKeys = {};
    oThis.cacheImplementer = null;
    oThis.cacheKeyPrefix = null;

    oThis._initParams(params);

    oThis._setCacheType();

    oThis._setCacheKeys();

    oThis._setInvertedCacheKeys();

    oThis._setCacheExpiry();

    oThis._setCacheImplementer();
  }

  /**
   * Fetch data from cache, in case of cache miss calls sub class method to fetch data from source
   *
   * @returns {Promise<Result>}: On success, data.value has value. On failure, error details returned.
   */
  async fetch() {
    const oThis = this,
      batchSize = 50;

    if (basicHelper.isEmptyObject(oThis.cacheKeys)) {
      console.trace('Empty cache keys object in lib/cacheMultiManagement/Base');
    } else {
      logger.debug('CACHE-FETCH## lib/cacheMultiManagement/Base cache key: ', oThis.cacheKeys);
    }

    let data = await oThis._fetchFromCache();

    let fetchDataRsp = null;

    // If there are any cache misses then fetch that data from source.
    while (data.cacheMiss.length > 0) {
      const cacheMissData = data.cacheMiss.splice(0, batchSize);
      fetchDataRsp = await oThis.fetchDataFromSource(cacheMissData);

      // DO NOT WAIT for cache being set
      for (let index = 0; index < cacheMissData.length; index++) {
        const cacheMissFor = cacheMissData[index];
        const dataToSet =
          fetchDataRsp.data[cacheMissFor] || fetchDataRsp.data[cacheMissFor.toString().toLowerCase()] || {};
        data.cachedData[cacheMissFor] = dataToSet;
        oThis._setCache(cacheMissFor, dataToSet);
      }
    }

    return Promise.resolve(responseHelper.successWithData(data.cachedData));
  }

  /**
   * Delete the cache entry
   *
   * @returns {Promise<*>}
   */
  async clear() {
    const oThis = this;
    let promises = [];
    for (let index = 0; index < Object.keys(oThis.cacheKeys).length; index++) {
      const cacheKey = Object.keys(oThis.cacheKeys)[index];
      promises.push(oThis.cacheImplementer.del(cacheKey));
    }
    return Promise.all(promises);
  }

  /**
   * Set cache implementer in oThis.cacheExpiry and return it
   *
   * @returns {Number}
   */
  _setCacheImplementer() {
    const oThis = this;

    if (oThis.cacheType === cacheManagementConst.inMemory) {
      oThis.cacheObject = InMemoryCacheProvider.getInstance(oThis.consistentBehavior);
    } else if (oThis.cacheType === cacheManagementConst.memcached) {
      oThis.cacheObject = MemcachedProvider.getInstance(oThis.consistentBehavior);
    } else {
      throw new Error(`shared_cacheManagement: Invalid cache type: ${oThis.cacheType}`);
    }

    // Set cacheImplementer to perform caching operations
    oThis.cacheImplementer = oThis.cacheObject.cacheInstance;
  }

  /**
   * Set inverted cache keys
   *
   * @private
   */
  _setInvertedCacheKeys() {
    const oThis = this;

    oThis.invertedCacheKeys = util.invert(oThis.cacheKeys);
  }

  // Private methods start from here

  /**
   * Fetch from cache
   *
   * @returns {Object}
   */
  async _fetchFromCache() {
    const oThis = this;
    const cache_keys = Object.keys(oThis.cacheKeys),
      cache_miss = [],
      cachedResponse = {},
      batchSize = 500;
    let cacheFetchResponse = null,
      process_cache_keys = [];

    while (cache_keys.length > 0) {
      process_cache_keys = cache_keys.splice(0, batchSize);
      cacheFetchResponse = await oThis.cacheImplementer.multiGet(process_cache_keys);

      if (cacheFetchResponse.isSuccess()) {
        const cachedData = cacheFetchResponse.data.response;
        for (let index = 0; index < process_cache_keys.length; index++) {
          const cacheKey = process_cache_keys[index];
          if (cachedData[cacheKey]) {
            cachedResponse[oThis.cacheKeys[cacheKey]] = JSON.parse(cachedData[cacheKey]);
          } else {
            cache_miss.push(oThis.cacheKeys[cacheKey]);
          }
        }
      } else {
        logger.error('==>Error while getting from cache: ', cacheFetchResponse.getDebugData());
        for (let index = 0; index < process_cache_keys.length; index++) {
          const cacheKey = process_cache_keys[index];
          cache_miss.push(oThis.cacheKeys[cacheKey]);
        }
      }
    }

    return { cacheMiss: cache_miss, cachedData: cachedResponse };
  }

  /**
   * Set data in cache.
   *
   * @param {String} key: key for cache data
   * @param {Object} dataToSet: data to set in cache
   *
   * @return {Promise|*|{$ref}|PromiseLike<T>|Promise<T>}
   * @private
   */
  _setCache(key, dataToSet) {
    const oThis = this;

    const setCacheFunction = function(keyToSet, value) {
      const cacheKey = oThis.invertedCacheKeys[keyToSet.toString()];

      return oThis.cacheImplementer.set(cacheKey, JSON.stringify(value), oThis.cacheExpiry);
    };

    return setCacheFunction(key, dataToSet).then(function(cacheSetResponse) {
      if (cacheSetResponse.isFailure()) {
        const errorObject = responseHelper.error({
          internal_error_identifier: 'cache_not_set:l_cmm_b_1',
          api_error_identifier: 'cache_not_set',
          debug_options: { cacheSetResponse: cacheSetResponse.getDebugData(), key: key, dataToSet: dataToSet }
        });
        createErrorLogsEntry.perform(errorObject, ErrorLogsConstants.mediumSeverity);
        logger.error('l_cmm_b_1', 'Error in setting cache.', cacheSetResponse.getDebugData());
      }
    });
  }

  /**
   * Cache key prefix
   *
   * @return {String}
   */
  _cacheKeyPrefix() {
    const oThis = this;
    if (oThis.cacheKeyPrefix) {
      return oThis.cacheKeyPrefix;
    }
    oThis.cacheKeyPrefix = cacheManagementConst.keyPrefix;

    return oThis.cacheKeyPrefix;
  }

  /**
   *
   * @param encryptedData
   * @return {Promise<*>}
   * @private
   */
  async _kmsDecryptWithLocalCipherEncrypt(encryptedData, kmsEncryptionPurpose) {
    if (!encryptedData) {
      throw new Error(`encryptedData not present`);
    }

    if (!kmsEncryptionPurpose) {
      throw new Error(`kmsEncryptionPurpose not present`);
    }

    let KMSObject = new KmsWrapper(kmsEncryptionPurpose);
    let decryptedSalt = await KMSObject.decrypt(encryptedData);
    if (!decryptedSalt['Plaintext']) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_cmm_b_2',
          api_error_identifier: 'invalid_params'
        })
      );
    }

    let decryptedData = decryptedSalt['Plaintext'];

    let lcEncryptedData = localCipher.encrypt(coreConstants.CACHE_SHA_KEY, decryptedData);

    return Promise.resolve(responseHelper.successWithData({ encryptedData: lcEncryptedData }));
  }

  // Methods which sub class would have to implement

  /**
   * Init params in oThis
   *
   * @param params
   * @private
   */
  _initParams(params) {
    throw new Error('Sub-class to implement');
  }

  /**
   * Set cache type.
   *
   * @sets oThis.cacheType
   *
   * @returns {string}
   */
  _setCacheType() {
    throw new Error('Sub-class to implement');
  }

  /**
   * Set cache keys in oThis.cacheKeys and return it
   *
   * @return {String}
   */
  _setCacheKeys() {
    throw new Error('Sub-class to implement');
  }

  /**
   * Set cache expiry in oThis.cacheExpiry and return it
   *
   * @return {Number}
   */
  _setCacheExpiry() {
    throw new Error('Sub-class to implement');
  }

  /**
   * Fetch data from source.
   * NOTES: 1. return should be of klass Result
   *        2. data attr of return is returned and set in cache
   *
   * @returns {Result}
   */
  async fetchDataFromSource() {
    throw new Error('Sub-class to implement');
  }
}

module.exports = CacheMultiManagementBase;
