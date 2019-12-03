const rootPrefix = '../..',
  RabbitMqEnqueueBase = require(rootPrefix + '/lib/rabbitMqEnqueue/Base'),
  rabbitMqProvider = require(rootPrefix + '/lib/providers/rabbitMq'),
  machineKindConstant = require(rootPrefix + '/lib/globalConstant/machineKind'),
  configStrategyConstants = require(rootPrefix + '/lib/globalConstant/configStrategy');

/**
 * Class for pixels job enqueue.
 *
 * @class PixelsEnqueue
 */
class PixelsEnqueue extends RabbitMqEnqueueBase {
  /**
   * Get rabbitMq provider.
   *
   * @returns {string}
   */
  getRmqProvider() {
    return rabbitMqProvider.getInstance(configStrategyConstants.pixelsRabbitmq, machineKindConstant.appServerKind);
  }

  get jobProcessorFactory() {
    return require(rootPrefix + '/lib/jobs/pixels/factory');
  }
}

module.exports = new PixelsEnqueue();
