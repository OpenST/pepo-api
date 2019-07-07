const OSTCache = require('@ostdotcom/cache');

const rootPrefix = '../..',
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement'),
  configStrategyConstants = require(rootPrefix + '/lib/globalConstant/configStrategy'),
  configStrategyProvider = require(rootPrefix + '/lib/providers/configStrategy');

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
   * @returns {Promise<object>}
   */
  async getInstance(cacheConsistentBehavior) {
    const memcachedConfigResponse = await configStrategyProvider.getConfigForKind(configStrategyConstants.memcached);

    if (memcachedConfigResponse.isFailure()) {
      return memcachedConfigResponse;
    }

    const memcachedConfig = memcachedConfigResponse.data[configStrategyConstants.memcached];

    const cacheConfigStrategy = {
      cache: {
        engine: cacheManagementConst.memcached,
        servers: memcachedConfig.servers,
        defaultTtl: memcachedConfig.defaultTtl,
        consistentBehavior: cacheConsistentBehavior || memcachedConfig.consistentBehavior
      }
    };

    return OSTCache.getInstance(cacheConfigStrategy);
  }
}

module.exports = new CacheProvider();
