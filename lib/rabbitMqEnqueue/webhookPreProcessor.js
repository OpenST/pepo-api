const rootPrefix = '../..',
  RabbitMqEnqueueBase = require(rootPrefix + '/lib/rabbitMqEnqueue/Base'),
  rabbitMqProvider = require(rootPrefix + '/lib/providers/rabbitMq'),
  machineKindConstant = require(rootPrefix + '/lib/globalConstant/machineKind'),
  configStrategyConstants = require(rootPrefix + '/lib/globalConstant/configStrategy');

/**
 * Class for webhookPreProcessor job enqueue.
 *
 * @class WebhookPreProcessor
 */
class WebhookPreProcessorEnqueue extends RabbitMqEnqueueBase {
  /**
   * Get rabbitMq provider.
   *
   * @returns {string}
   */
  getRmqProvider() {
    return rabbitMqProvider.getInstance(
      configStrategyConstants.webhookPreProcessorRabbitmq,
      machineKindConstant.appServerKind
    );
  }

  get jobProcessorFactory() {
    return require(rootPrefix + '/lib/jobs/webhookPreProcessor/factory');
  }
}

module.exports = new WebhookPreProcessorEnqueue();
