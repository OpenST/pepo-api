const rootPrefix = '../..',
  RabbitMqEnqueueBase = require(rootPrefix + '/lib/rabbitMqEnqueue/Base'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  rabbitMqProvider = require(rootPrefix + '/lib/providers/rabbitMq'),
  cloudfrontWrapper = require(rootPrefix + '/lib/aws/CloudfrontWrapper'),
  machineKindConstants = require(rootPrefix + '/lib/globalConstant/machineKind'),
  configStrategyConstants = require(rootPrefix + '/lib/globalConstant/config/configStrategy');

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
    return rabbitMqProvider.getInstance(configStrategyConstants.bgJobRabbitmq, machineKindConstants.appServerKind);
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
