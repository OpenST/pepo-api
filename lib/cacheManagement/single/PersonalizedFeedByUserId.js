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
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement');

const errorConfig = basicHelper.fetchErrorConfig(apiVersions.v1);

class PersonalizedFeedByUserId {
  /**
   * @constructor
   *
   * @param params
   * @param params.userId {Number}
   */
  constructor(params) {
    const oThis = this;

    oThis.cacheType = cacheManagementConst.memcached;
    oThis.userId = params.userId;

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

    oThis.cacheKey = cacheManagementConst.keyPrefix + '_pf_uid_' + oThis.userId;

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

    oThis.cacheExpiry = cacheManagementConst.threeDayExpiryTimeInterval;

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
  async setCacheData(dataToSet) {
    const oThis = this;

    await oThis._setCacheImplementer();
    logger.debug('CACHE-SET## lib/cacheManagement/single/PersonalizedFeedByUserId cache key: ', oThis.cacheKey);

    let setCacheFunction = function() {
      return oThis.cacheImplementer.set(oThis.cacheKey, dataToSet, oThis.cacheExpiry);
    };

    return setCacheFunction().then(async function(cacheSetResponse) {
      if (cacheSetResponse.isFailure()) {
        const errorObject = responseHelper.error({
          internal_error_identifier: 'cache_not_set:l_cm_s_pfbui_1',
          api_error_identifier: 'cache_not_set',
          debug_options: { cacheSetResponse: cacheSetResponse.getDebugData(), dataToSet: dataToSet }
        });

        await createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);
        logger.error('l_cm_s_pfbui_1', 'Error in setting cache.', cacheSetResponse.getDebugData());
        return errorObject;
      }
      return responseHelper.successWithData({});
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

    logger.debug('CACHE-FETCH## lib/cacheManagement/shared/PersonalizedFeedByUserId cache key: ', oThis.cacheKey);

    let data = await oThis._fetchFromCache();

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

module.exports = PersonalizedFeedByUserId;
