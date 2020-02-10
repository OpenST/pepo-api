const OSTCache = require('@ostdotcom/cache');

const rootPrefix = '../..',
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  cacheManagementConstants = require(rootPrefix + '/lib/globalConstant/cacheManagement'),
  configStrategyConstants = require(rootPrefix + '/lib/globalConstant/config/configStrategy');

// Declare variables.
const cacheInstanceMap = {};

/**
 * Class for shared memcache provider.
 *
 * @class CacheProvider
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
    let cacheObject = cacheInstanceMap[cacheConsistentBehavior];
    if (cacheObject) {
      return cacheObject;
    }

    const configStrategyProvider = require(rootPrefix + '/lib/providers/configStrategy');

    const memcachedConfigResponse = await configStrategyProvider.getConfigForKind(configStrategyConstants.memcached);

    if (memcachedConfigResponse.isFailure()) {
      return memcachedConfigResponse;
    }

    const memcachedConfig = memcachedConfigResponse.data[configStrategyConstants.memcached];

    const cacheConfigStrategy = {
      cache: {
        engine: cacheManagementConstants.memcached,
        servers: memcachedConfig.servers,
        defaultTtl: memcachedConfig.defaultTtl,
        consistentBehavior: cacheConsistentBehavior || memcachedConfig.consistentBehavior
      }
    };

    cacheObject = OSTCache.getInstance(cacheConfigStrategy);

    const cacheImplementer = cacheObject.cacheInstance;

    cacheImplementer.client.on('issue', async function(details) {
      const errorMessage = 'Server ' + details.server + ' seems to be down: ' + details.messages.join('');
      logger.error(errorMessage);

      const errorObject = responseHelper.error({
        internal_error_identifier: 'l_cm_m_b_3',
        api_error_identifier: 'service_unavailable',
        debug_options: { errorMessage: errorMessage }
      });
      await createErrorLogsEntry.perform(errorObject, errorLogsConstants.mediumSeverity);
    });

    cacheInstanceMap[cacheConsistentBehavior] = cacheObject;

    return cacheObject;
  }
}

module.exports = new CacheProvider();
