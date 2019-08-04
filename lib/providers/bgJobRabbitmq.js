const OSTNotification = require('@ostdotcom/notification');

const rootPrefix = '../..',
  configStrategyConstants = require(rootPrefix + '/lib/globalConstant/configStrategy'),
  configStrategyProvider = require(rootPrefix + '/lib/providers/configStrategy'),
  machineKindConstant = require(rootPrefix + '/lib/globalConstant/machineKind');

class RabbitmqProvider {
  constructor() {}

  /**
   * Get instance
   *
   * @param machineKind
   * @return {Promise<*>}
   */
  async getInstance(machineKind) {
    const configResponse = await configStrategyProvider.getConfigForKind(configStrategyConstants.bgJobRabbitmq);

    if (configResponse.isFailure()) {
      return Promise.reject(configResponse);
    }

    let rabbitmqConfig = Object.assign(
      {},
      configResponse.data[configStrategyConstants.bgJobRabbitmq],
      machineKindConstant.rmqOptionsFor(machineKind),
      {
        enableRabbitmq: '1'
      }
    );

    return OSTNotification.getInstance({
      rabbitmq: rabbitmqConfig
    });
  }
}

module.exports = new RabbitmqProvider();
