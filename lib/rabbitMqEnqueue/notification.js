const rootPrefix = '../..',
  RabbitMqEnqueueBase = require(rootPrefix + '/lib/rabbitMqEnqueue/Base'),
  rabbitMqProvider = require(rootPrefix + '/lib/providers/rabbitMq'),
  machineKindConstant = require(rootPrefix + '/lib/globalConstant/machineKind'),
  configStrategyConstants = require(rootPrefix + '/lib/globalConstant/config/configStrategy');

/**
 * Class for notification job enqueue.
 *
 * @class NotificationEnqueue
 */
class NotificationEnqueue extends RabbitMqEnqueueBase {
  /**
   * Get rabbitMq provider.
   *
   * @returns {string}
   */
  getRmqProvider() {
    return rabbitMqProvider.getInstance(
      configStrategyConstants.notificationRabbitmq,
      machineKindConstant.appServerKind
    );
  }

  get jobProcessorFactory() {
    return require(rootPrefix + '/lib/jobs/notification/factory');
  }
}

module.exports = new NotificationEnqueue();
