const rootPrefix = '../..',
  CronProcessesModel = require(rootPrefix + '/app/models/mysql/big/CronProcesses'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  configStrategyConstants = require(rootPrefix + '/lib/globalConstant/configStrategy'),
  cronProcessesConstants = require(rootPrefix + '/lib/globalConstant/big/cronProcesses');

/**
 * Class for socket process id selector.
 *
 * @class ProcessIdsSelector
 */
class ProcessIdsSelector {
  /**
   * Constructor for socket process id selector.
   *
   * @constructor
   */
  constructor() {
    const oThis = this;

    oThis.wsServerIdentifier = coreConstants.WS_SERVER_IDENTIFIER;

    oThis.processId = null;
    oThis.rabbitLoadDetailsMap = {};
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<null|*>}
   */
  async perform() {
    const oThis = this;

    if (!oThis.wsServerIdentifier) {
      throw new Error(
        `WS_SERVER_IDENTIFIER not present env vars of machine. WS_SERVER_IDENTIFIER: ${oThis.wsServerIdentifier}`
      );
    }

    let socketCronProcessId = null;

    const allSocketCronProcesses = await new CronProcessesModel()
      .select('*')
      .where(['kind = ?', cronProcessesConstants.invertedKinds[cronProcessesConstants.socketJobProcessor]])
      .fire();

    for (let index = 0; index < allSocketCronProcesses.length; index++) {
      const socketCronProcess = allSocketCronProcesses[index],
        cronParams = JSON.parse(socketCronProcess.params),
        serverIdentifier = cronParams.wsid;

      oThis.rabbitLoadDetailsMap[cronParams.rmqCId] = oThis.rabbitLoadDetailsMap[cronParams.rmqCId] || 0;
      oThis.rabbitLoadDetailsMap[cronParams.rmqCId] += 1;

      if (serverIdentifier === oThis.wsServerIdentifier) {
        socketCronProcessId = socketCronProcess.id;
        if (
          socketCronProcess.status !== cronProcessesConstants.invertedStatuses[cronProcessesConstants.inactiveStatus]
        ) {
          return socketCronProcessId;
        }
      }
    }

    if (!socketCronProcessId) {
      const insertQueryResponse = await new CronProcessesModel()
        .insert({
          kind: cronProcessesConstants.invertedKinds[cronProcessesConstants.socketJobProcessor],
          kind_name: cronProcessesConstants.socketJobProcessor,
          status: cronProcessesConstants.invertedStatuses[cronProcessesConstants.stoppedStatus]
        })
        .fire();
      socketCronProcessId = insertQueryResponse.insertId;
    }

    const rmqIdWithLeastLoad = await oThis._selectRabbitMqWithLeastLoad();
    const cronParams = {
      topics: ['socket.' + socketCronProcessId],
      queues: ['socket_' + socketCronProcessId],
      prefetchCount: 25,
      wsid: oThis.wsServerIdentifier, // Server identifier, set in env.
      rmqCId: rmqIdWithLeastLoad
    };

    await new CronProcessesModel()
      .update({
        params: JSON.stringify(cronParams)
      })
      .where({ id: socketCronProcessId })
      .fire();

    return socketCronProcessId;
  }

  /**
   * Selects rabbitMq with least number of users.
   *
   * @returns {Promise<*>}
   * @private
   */
  async _selectRabbitMqWithLeastLoad() {
    const oThis = this;

    await oThis._fetchSocketRmqNodes();

    let socketRmqIdWithLeastCount,
      leastLoadCount = 99999;

    for (const socketRmqId in oThis.rabbitLoadDetailsMap) {
      const currentCount = oThis.rabbitLoadDetailsMap[socketRmqId];
      if (currentCount < leastLoadCount) {
        socketRmqIdWithLeastCount = socketRmqId;
        leastLoadCount = currentCount;
      }
    }

    return socketRmqIdWithLeastCount;
  }

  /**
   * Fetches socket rmq nodes from config strategies.
   *
   * @sets oThis.rabbitLoadDetailsMap
   *
   * @returns {Promise<result>}
   * @private
   */
  async _fetchSocketRmqNodes() {
    const oThis = this,
      configStrategyProvider = require(rootPrefix + '/lib/providers/configStrategy'),
      socketRmqConfigResponse = await configStrategyProvider.getConfigForKind(configStrategyConstants.socketRabbitmq);

    if (socketRmqConfigResponse.isFailure()) {
      return socketRmqConfigResponse;
    }

    const socketRmqConfig = socketRmqConfigResponse.data[configStrategyConstants.socketRabbitmq],
      socketRmqs = socketRmqConfig.clusters;

    for (let index = 0; index < socketRmqs.length; index++) {
      const socketRmqId = socketRmqs[index].id;
      oThis.rabbitLoadDetailsMap[socketRmqId] = oThis.rabbitLoadDetailsMap[socketRmqId] || 0;
    }
  }
}

module.exports = new ProcessIdsSelector();
