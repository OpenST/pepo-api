const rootPrefix = '../..',
  RabbitMqEnqueueBase = require(rootPrefix + '/lib/rabbitMqEnqueue/Base'),
  rabbitMqProvider = require(rootPrefix + '/lib/providers/rabbitMq'),
  machineKindConstant = require(rootPrefix + '/lib/globalConstant/machineKind'),
  configStrategyConstants = require(rootPrefix + '/lib/globalConstant/configStrategy');

/**
 * Class for PepoMobileEvent job enqueue.
 *
 * @class PepoMobileEventEnqueue
 */
class PepoMobileEventEnqueue extends RabbitMqEnqueueBase {
  /**
   * Get rabbitMq provider.
   *
   * @returns {string}
   */
  getRmqProvider() {
    return rabbitMqProvider.getInstance(
      configStrategyConstants.pepoMobileEventRabbitmq,
      machineKindConstant.appServerKind
    );
  }

  get jobProcessorFactory() {
    return require(rootPrefix + '/lib/jobs/pepoMobileEvent/factory');
  }
}

module.exports = new PepoMobileEventEnqueue();
