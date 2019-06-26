/**
 * Cache management base
 *
 * @module lib/cacheManagement/shared/Base
 */
const rootPrefix = '../../..',
  KmsWrapper = require(rootPrefix + '/lib/authentication/KmsWrapper'),
  MemcachedProvider = require(rootPrefix + '/lib/providers/memcached'),
  InMemoryCacheProvider = require(rootPrefix + '/lib/providers/inMemoryCache'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement');

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

    oThis._initParams(params);

    oThis._setUseObject();

    oThis._setCacheType();

    oThis.setCacheKey();

    oThis.setCacheExpiry();
  }

  /**
   * Fetch data from cache, in case of cache miss calls sub class method to fetch data from source
   *
   * @returns {Promise<Result>}: On success, data.value has value. On failure, error details returned.
   */
  async fetch() {
    const oThis = this;

    let data = await oThis._fetchFromCache();

    logger.debug('CACHE-FETCH## lib/cacheManagement/single/Base cache key: ', oThis.cacheKey);

    // If cache miss call sub class method to fetch data from source and set cache
    if (!data) {
      logger.debug('Data not found in cache: ', oThis.cacheKey);
      const fetchDataRsp = await oThis.fetchDataFromSource();

      // If fetch from source failed do not set cache and return error response
      if (fetchDataRsp.isFailure()) {
        return fetchDataRsp;
      }

      data = fetchDataRsp.data;
      // DO NOT WAIT for cache being set
      if (data) {
        // Setting cache only if data is defined and not an empty object.
        oThis._setCache(data);
      }
    }

    return responseHelper.successWithData(data);
  }

  /**
   * Delete the cache entry.
   *
   * NOTE: If sub-class is over-riding this method, make sure to call
   *       oThis.setCacheImplementer() to set oThis.cacheImplementer.
   *
   * @returns {Promise<*>}
   */
  async clear() {
    const oThis = this;

    await oThis.setCacheImplementer();

    logger.debug('CACHE-CLEAR## lib/cacheManagement/single/Base cache key: ', oThis.cacheKey);

    return oThis.cacheImplementer.del(oThis.cacheKey);
  }

  /**
   * Set cache implementer in oThis.cacheImplementer.
   *
   * @returns {Promise<void>}
   */
  async setCacheImplementer() {
    const oThis = this;

    if (oThis.cacheImplementer) {
      return;
    }

    let cacheObject = {};

    if (oThis.cacheType === cacheManagementConst.inMemory) {
      cacheObject = InMemoryCacheProvider.getInstance(oThis.consistentBehavior);
    } else if (oThis.cacheType === cacheManagementConst.memcached) {
      cacheObject = await MemcachedProvider.getInstance(oThis.consistentBehavior);
    } else {
      throw new Error(`shared_cacheManagement: Invalid cache type: ${oThis.cacheType}`);
    }

    // Set cacheImplementer to perform caching operations
    oThis.cacheImplementer = cacheObject.cacheInstance;
  }

  // Private methods start from here

  /**
   * Fetch from cache
   *
   * NOTE: If sub-class is over-riding this method, make sure to call
   *       oThis.setCacheImplementer() to set oThis.cacheImplementer.
   *
   * @returns {Object}
   */
  async _fetchFromCache() {
    const oThis = this;

    let cacheFetchResponse = null,
      cacheData = null;

    await oThis.setCacheImplementer();

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
   * NOTE: If sub-class is over-riding this method, make sure to call
   *       oThis.setCacheImplementer() to set oThis.cacheImplementer.
   *
   * @return {Promise}
   * @private
   */
  async _setCache(dataToSet) {
    const oThis = this;

    await oThis.setCacheImplementer();

    const setCacheFunction = function() {
      if (oThis.useObject) {
        return oThis.cacheImplementer.setObject(oThis.cacheKey, dataToSet, oThis.cacheExpiry);
      }

      return oThis.cacheImplementer.set(oThis.cacheKey, dataToSet, oThis.cacheExpiry);
    };

    return setCacheFunction().then(async function(cacheSetResponse) {
      if (cacheSetResponse.isFailure()) {
        const errorObject = responseHelper.error({
          internal_error_identifier: 'cache_not_set:l_cm_s_b_1',
          api_error_identifier: 'cache_not_set',
          debug_options: { cacheSetResponse: cacheSetResponse.getDebugData(), dataToSet: dataToSet }
        });
        await createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);
        logger.error('l_cm_s_b_1', 'Error in setting cache.', cacheSetResponse.getDebugData());
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
      throw new Error('encryptedData not present.');
    }

    if (!kmsEncryptionPurpose) {
      throw new Error('kmsEncryptionPurpose not present.');
    }

    const KMSObject = new KmsWrapper(kmsEncryptionPurpose);
    const decryptedSalt = await KMSObject.decrypt(encryptedData);

    if (!decryptedSalt.Plaintext) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_cm_s_b_2',
          api_error_identifier: 'invalid_params'
        })
      );
    }

    const decryptedData = decryptedSalt.Plaintext;

    const lcEncryptedData = localCipher.encrypt(coreConstants.CACHE_SHA_KEY, decryptedData);

    return Promise.resolve(responseHelper.successWithData({ encryptedData: lcEncryptedData }));
  }

  // Methods which the sub-class would have to implement

  /**
   * Init params in oThis
   *
   * @private
   */
  _initParams() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Set use object
   *
   * @sets oThis.useObject
   *
   * @private
   */
  _setUseObject() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Set cache type.
   *
   * @sets oThis.cacheType
   *
   * @returns {string}
   */
  _setCacheType() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Set cache key in oThis.cacheKey and return it
   *
   * @returns {String}
   */
  setCacheKey() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Set cache expiry in oThis.cacheExpiry and return it
   *
   * @returns {Number}
   */
  setCacheExpiry() {
    throw new Error('Sub-class to implement.');
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
    throw new Error('Sub-class to implement.');
  }
}

module.exports = CacheManagementBase;
