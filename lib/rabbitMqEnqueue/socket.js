const rootPrefix = '../..',
  RabbitMqEnqueueBase = require(rootPrefix + '/lib/rabbitMqEnqueue/Base'),
  machineKindConstant = require(rootPrefix + '/lib/globalConstant/machineKind'),
  configStrategyConstants = require(rootPrefix + '/lib/globalConstant/configStrategy');

/**
 * Class for socket job enqueue.
 *
 * @class SocketEnqueue
 */
class SocketEnqueue extends RabbitMqEnqueueBase {
  get rabbitMqConfigKind() {
    return configStrategyConstants.socketRabbitmq;
  }

  get machineKind() {
    return machineKindConstant.appServerKind;
  }
}

module.exports = new SocketEnqueue();
