const OSTCache = require('@ostdotcom/cache');

const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  configStrategyProvider = require(rootPrefix + '/lib/providers/configStrategy'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement'),
  configStrategyConstants = require(rootPrefix + '/lib/globalConstant/configStrategy');

/**
 * Class for shared memcache provider
 *
 * @class
 */
class CacheProvider {
  /**
   * Get instance of ost-cache.
   *
   * @param {number} cacheConsistentBehavior
   *
   * @returns {object}
   */
  getInstance(cacheConsistentBehavior) {
    const memcachedConfig = configStrategyProvider.getConfigForKind(configStrategyConstants.memcached);

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
