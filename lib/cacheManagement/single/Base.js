/**
 * Cache management base
 *
 * @module lib/cacheManagement/shared/Base
 */
const rootPrefix = '../../..',
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  ErrorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  InMemoryCacheProvider = require(rootPrefix + '/lib/providers/inMemoryCache'),
  MemcachedProvider = require(rootPrefix + '/lib/providers/memcached'),
  KmsWrapper = require(rootPrefix + '/lib/authentication/KmsWrapper');

/**
 * Class for cache management base
 *
 * @class
 */
class CacheManagementBase {
  /**
   * Constructor
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

    oThis.consistentBehavior = '1';

    oThis.useObject = null;
    oThis.cacheKey = null;
    oThis.cacheLevel = null;
    oThis.cacheExpiry = null;
    oThis.cacheImplementer = null;
    oThis.cacheKeyPrefix = null;
    oThis.cacheType = null;
    oThis.cacheObject = null;

    oThis._initParams(params);

    oThis._setUseObject();

    oThis._setCacheType();

    oThis.setCacheKey();

    oThis.setCacheExpiry();

    oThis.setCacheImplementer();
  }

  /**
   * Fetch data from cache, in case of cache miss calls sub class method to fetch data from source
   *
   * @returns {Promise<Result>}: On success, data.value has value. On failure, error details returned.
   */
  async fetch() {
    const oThis = this;

    if (oThis.cacheKey) {
      logger.debug('CACHE-FETCH## lib/cacheManagement/single/Base cache key: ', oThis.cacheKey);
    } else {
      console.trace('Empty cache key in lib/cacheManagement/single/Base');
    }

    let data = await oThis._fetchFromCache();

    // If cache miss call sub class method to fetch data from source and set cache
    if (!data) {
      const fetchDataRsp = await oThis.fetchDataFromSource();

      // If fetch from source failed do not set cache and return error response
      if (fetchDataRsp.isFailure()) {
        return fetchDataRsp;
      }

      data = fetchDataRsp.data;
      // DO NOT WAIT for cache being set
      if (data == 0 || (data && Object.keys(data).length > 0)) {
        //Setting cache only if data is defined and not an empty object.
        oThis._setCache(data);
      }
    }

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

  /**
   * Set cache implementer in oThis.cacheExpiry and return it
   *
   * @returns {Number}
   */
  setCacheImplementer() {
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

  // Private methods start from here

  /**
   * Fetch from cache
   *
   * @returns {Object}
   */
  async _fetchFromCache() {
    const oThis = this;
    let cacheFetchResponse = null,
      cacheData = null;

    if (oThis.useObject) {
      cacheFetchResponse = await oThis.cacheImplementer.getObject(oThis.cacheKey);
    } else {
      cacheFetchResponse = await oThis.cacheImplementer.get(oThis.cacheKey);
    }

    if (cacheFetchResponse.isSuccess()) {
      cacheData = cacheFetchResponse.data.response;
    }

    return cacheData;
  }

  /**
   * Set data in cache.
   *
   * @param {Object} dataToSet: data to set in cache
   *
   * @return {Promise|*|{$ref}|PromiseLike<T>|Promise<T>}
   * @private
   */
  _setCache(dataToSet) {
    const oThis = this;

    const setCacheFunction = function() {
      if (oThis.useObject) {
        return oThis.cacheImplementer.setObject(oThis.cacheKey, dataToSet, oThis.cacheExpiry);
      }

      return oThis.cacheImplementer.set(oThis.cacheKey, dataToSet, oThis.cacheExpiry);
    };

    return setCacheFunction().then(function(cacheSetResponse) {
      if (cacheSetResponse.isFailure()) {
        const errorObject = responseHelper.error({
          internal_error_identifier: 'cache_not_set:l_cm_b_1',
          api_error_identifier: 'cache_not_set',
          debug_options: { cacheSetResponse: cacheSetResponse.getDebugData(), dataToSet: dataToSet }
        });
        createErrorLogsEntry.perform(errorObject, ErrorLogsConstants.mediumSeverity);
        logger.error('l_cm_b_1', 'Error in setting cache.', cacheSetResponse.getDebugData());
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
          internal_error_identifier: 'l_cm_b_2',
          api_error_identifier: 'invalid_params'
        })
      );
    }

    let decryptedData = decryptedSalt['Plaintext'];

    let lcEncryptedData = localCipher.encrypt(coreConstants.CACHE_SHA_KEY, decryptedData);

    return Promise.resolve(responseHelper.successWithData({ encryptedData: lcEncryptedData }));
  }

  // Methods which the sub-class would have to implement

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
   * Set use object
   *
   * @sets oThis.useObject
   *
   * @private
   */
  _setUseObject() {
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
   * Set cache key in oThis.cacheKey and return it
   *
   * @returns {String}
   */
  setCacheKey() {
    throw new Error('Sub-class to implement');
  }

  /**
   * Set cache expiry in oThis.cacheExpiry and return it
   *
   * @returns {Number}
   */
  setCacheExpiry() {
    throw new Error('Sub-class to implement');
  }

  /**
   * Fetch data from source.
   *
   * NOTES: 1. return should be of Class Result
   *        2. data attr of return is returned and set in cache
   *
   * @returns {Result}
   */
  async fetchDataFromSource() {
    throw new Error('Sub-class to implement');
  }
}

module.exports = CacheManagementBase;
