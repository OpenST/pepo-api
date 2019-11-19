'use strict';

/*
 * This cache checks if the signature is already used in the last 1 minute
 */

const rootPrefix = '../../..',
  MemcachedProvider = require(rootPrefix + '/lib/providers/memcached'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
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
   * Fetch from cache
   *
   * @return {Promise<*|result>}
   */
  async fetch() {
    const oThis = this;

    // Call sub class method to set cache implementer using params provided
    await oThis._setCacheImplementer();

    logger.debug('CACHE-FETCH## lib/cacheManagement/shared/ReplayAttack cache key: ', oThis.cacheKey);

    return oThis.cacheImplementer.acquireLock(oThis.cacheKey, oThis.cacheExpiry);
  }
}

module.exports = ReplayAttackCache;
