const rootPrefix = '../..',
  RabbitMqEnqueueBase = require(rootPrefix + '/lib/rabbitMqEnqueue/Base'),
  machineKindConstant = require(rootPrefix + '/lib/globalConstant/machineKind'),
  configStrategyConstants = require(rootPrefix + '/lib/globalConstant/configStrategy');

/**
 * Class for bg job enqueue.
 *
 * @class BgJobEnqueue
 */
class BgJobEnqueue extends RabbitMqEnqueueBase {
  get rabbitMqConfigKind() {
    return configStrategyConstants.bgJobRabbitmq;
  }

  get machineKind() {
    return machineKindConstant.appServerKind;
  }

  get jobProcessorFactory() {
    return require(rootPrefix + '/lib/jobs/bg/factory');
  }
}

module.exports = new BgJobEnqueue();
