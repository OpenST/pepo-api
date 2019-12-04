const rootPrefix = '../..',
  RabbitMqEnqueueBase = require(rootPrefix + '/lib/rabbitMqEnqueue/Base'),
  rabbitMqProvider = require(rootPrefix + '/lib/providers/rabbitMq'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  machineKindConstant = require(rootPrefix + '/lib/globalConstant/machineKind'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cloudfrontWrapper = require(rootPrefix + '/lib/aws/CloudfrontWrapper'),
  configStrategyConstants = require(rootPrefix + '/lib/globalConstant/configStrategy');

/**
 * Class for bg job enqueue.
 *
 * @class CdnCacheInvalidation
 */
class CdnCacheInvalidation extends RabbitMqEnqueueBase {
  /**
   * Get rabbitMq provider.
   *
   * @returns {string}
   */
  getRmqProvider() {
    return rabbitMqProvider.getInstance(configStrategyConstants.bgJobRabbitmq, machineKindConstant.appServerKind);
  }

  /**
   * Process message directly if publish fails.
   *
   * @param {object} messageParams
   *
   * @returns {Promise<{}>}
   */
  async processWithoutEnqueue(messageParams) {
    const messageDetails = messageParams.message.payload,
      pathArray = messageDetails.pathArray;

    await cloudfrontWrapper.invalidateCache(pathArray).catch(function(err) {
      logger.error('====Error for batch', pathArray);
      logger.error(err);
    });

    // Note - Not waiting for cache invalidation to go through since this is not happening in the background
  }
}

module.exports = new CdnCacheInvalidation();
