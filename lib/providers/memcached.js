'use strict';

/**
 * Cache instance provider which is not chain specific.
 *
 * @module lib/providers/memcached
 */

const OSTCache = require('@ostdotcom/cache');

const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class for shared memcache provider
 *
 * @class
 */
class CacheProvider {
  /**
   * Constructor for shared memcache provider
   *
   * @constructor
   */
  constructor() {}

  /**
   * Get instance of ost-cache.
   *
   * @param {Number} cacheConsistentBehavior
   *
   * @returns {Object}
   */
  getInstance(cacheConsistentBehavior) {
    const cacheConfigStrategy = {
      cache: {
        engine: cacheManagementConst.memcached,
        servers: coreConstants.MEMCACHE_SERVERS,
        defaultTtl: '86400',
        consistentBehavior: cacheConsistentBehavior
      }
    };

    return OSTCache.getInstance(cacheConfigStrategy);
  }
}

module.exports = new CacheProvider();
