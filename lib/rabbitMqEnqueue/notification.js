const rootPrefix = '../..',
  RabbitMqEnqueueBase = require(rootPrefix + '/lib/rabbitMqEnqueue/Base'),
  machineKindConstant = require(rootPrefix + '/lib/globalConstant/machineKind'),
  configStrategyConstants = require(rootPrefix + '/lib/globalConstant/configStrategy');

/**
 * Class for notification job enqueue.
 *
 * @class NotificationEnqueue
 */
class NotificationEnqueue extends RabbitMqEnqueueBase {
  get rabbitMqConfigKind() {
    return configStrategyConstants.notificationRabbitmq;
  }

  get machineKind() {
    return machineKindConstant.appServerKind;
  }
}

module.exports = new NotificationEnqueue();
