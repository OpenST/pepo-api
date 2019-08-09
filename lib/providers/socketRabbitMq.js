const OSTNotification = require('@ostdotcom/notification');

const rootPrefix = '../..',
  machineKindConstants = require(rootPrefix + '/lib/globalConstant/machineKind'),
  configStrategyProvider = require(rootPrefix + '/lib/providers/configStrategy');

/**
 * Class for Socket RabbitMq provider.
 *
 * @class SocketRabbitMqProvider
 */
class SocketRabbitMqProvider {
  /**
   * Get instance.
   *
   * @param {string} rabbitMqKind
   * @param {number} rmqId
   * @param {string} machineKind
   *
   * @return {Promise<*>}
   */
  async getInstance(rabbitMqKind, rmqId, machineKind) {
    const configResponse = await configStrategyProvider.getConfigForKind(rabbitMqKind);

    if (configResponse.isFailure()) {
      return Promise.reject(configResponse);
    }

    let rmqConfig = configResponse.data[rabbitMqKind],
      rmqClusters = rmqConfig.clusters,
      additionalRmqInfo = {};

    for (let i = 0; i < rmqClusters.length; i++) {
      let rmqCluster = rmqClusters[i];
      if (rmqCluster.id == rmqId) {
        additionalRmqInfo.host = rmqCluster.host;
        additionalRmqInfo.port = rmqCluster.port;
        additionalRmqInfo.clusterNodes = rmqCluster.clusterNodes;
      }
    }

    const rabbitMqConfig = Object.assign(
      {},
      rmqConfig,
      additionalRmqInfo,
      machineKindConstants.rmqOptionsFor(machineKind),
      {
        enableRabbitmq: '1'
      }
    );

    return OSTNotification.getInstance({
      rabbitmq: rabbitMqConfig
    });
  }
}

module.exports = new SocketRabbitMqProvider();
