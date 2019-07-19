const OSTCache = require('@ostdotcom/cache');

const rootPrefix = '../..',
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  configStrategyConstants = require(rootPrefix + '/lib/globalConstant/configStrategy');

const cacheInstanceMap = {};

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
        engine: cacheManagementConst.memcached,
        servers: memcachedConfig.servers,
        defaultTtl: memcachedConfig.defaultTtl,
        consistentBehavior: cacheConsistentBehavior || memcachedConfig.consistentBehavior
      }
    };

    cacheObject = OSTCache.getInstance(cacheConfigStrategy);

    let cacheImplementer = cacheObject.cacheInstance;

    cacheImplementer.client.on('issue', async function(details) {
      const errorMessage = 'Server ' + details.server + ' seems to be down: ' + details.messages.join('');
      logger.error(errorMessage);

      const errorObject = responseHelper.error({
        internal_error_identifier: 'l_cm_m_b_3',
        api_error_identifier: 'service_unavailable',
        debug_options: { errorMessage: errorMessage }
      });
      await createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);
    });

    cacheInstanceMap[cacheConsistentBehavior] = cacheObject;
    return cacheObject;
  }
}

module.exports = new CacheProvider();
