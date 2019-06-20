const OSTCache = require('@ostdotcom/cache');

/**
 * Class for in-memory cache provider.
 *
 * @class InMemoryCacheProvider
 */
class InMemoryCacheProvider {
  /**
   * Get instance of in-memory cache provider.
   *
   * @param {number/string} cacheConsistentBehavior
   *
   * @return {object}
   */
  getInstance(cacheConsistentBehavior) {
    const cacheConfigStrategy = {
      cache: {
        engine: 'none',
        namespace: `pepoApi_${cacheConsistentBehavior}`,
        defaultTtl: 36000,
        consistentBehavior: cacheConsistentBehavior
      }
    };

    return OSTCache.getInstance(cacheConfigStrategy);
  }
}

module.exports = new InMemoryCacheProvider();
