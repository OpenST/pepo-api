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
   * Enqueue message.
   *
   * @param {string} topic
   * @param {object} messageParams
   * @param {object} [options]
   * @param {string} [options.publishAfter]
   *
   * @returns {Promise<*>}
   */
  async enqueue(topic, messageParams, options = {}) {
    const oThis = this;

    logger.log(`Enqueue called for topic: ${topic} with params: ${JSON.stringify(messageParams)}`);

    const ostNotification = await oThis.getRmqProvider();

    const publishEventParams = {
      topics: [topic],
      publisher: 'PEPO',
      message: {
        kind: topic,
        payload: messageParams
      }
    };

    return ostNotification.publishEvent.perform(publishEventParams).catch(async function(error) {
      logger.log('error =====', error);

      const errorObj = responseHelper.error({
        internal_error_identifier: 'l_rme_cci_e_1',
        api_error_identifier: 'something_went_wrong',
        debug_options: { error: error }
      });

      await createErrorLogsEntry.perform(errorObj, errorLogsConstants.lowSeverity);

      return oThis._processWithoutEnqueue(publishEventParams);
    });
  }

  /**
   * Process message directly if publish fails
   * @param messageParams
   * @returns {Promise<{}>}
   * @private
   */
  async _processWithoutEnqueue(messageParams) {
    const messageDetails = messageParams.message.payload,
      pathArray = messageDetails.pathArray;

    await cloudfrontWrapper.invalidateCache(pathArray).catch(function(err) {
      logger.error('====Error for batch', pathArray);
      logger.error(err);
    });

    // Note - Not waiting for cache invalidation to go through since this is not happening in the background

    return Promise.resolve({});
  }
}

module.exports = new CdnCacheInvalidation();
