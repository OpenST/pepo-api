const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  configStrategyConstants = require(rootPrefix + '/lib/globalConstant/configStrategy'),
  CronProcessModel = require(rootPrefix + '/app/models/mysql/CronProcesses'),
  cronProcessesConstants = require(rootPrefix + '/lib/globalConstant/cronProcesses');

class ProcessIdsSelector {
  constructor() {
    const oThis = this;

    oThis.wsServerIdentifier = coreConstants.WS_SERVER_IDENTIFIER;

    oThis.processId = null;
    oThis.rabbitLoadDetailsMap = {};
  }

  async perform() {
    const oThis = this;

    let socketCronProcessId = null,
      allSocketCronProcesses = await new CronProcessModel()
        .select('*')
        .where(['kind = ?', cronProcessesConstants.invertedKinds[cronProcessesConstants.socketJobProcessor]])
        .fire();

    for (let i = 0; i < allSocketCronProcesses.length; i++) {
      let socketCronProcess = allSocketCronProcesses[i],
        cronParams = JSON.parse(socketCronProcess.params),
        serverIdentifier = cronParams['wsid'];

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
      const insertQueryResponse = await new CronProcessModel()
        .insert({
          kind: cronProcessesConstants.invertedKinds[cronProcessesConstants.socketJobProcessor],
          kind_name: cronProcessesConstants.socketJobProcessor,
          status: cronProcessesConstants.invertedStatuses[cronProcessesConstants.stoppedStatus]
        })
        .fire();
      socketCronProcessId = insertQueryResponse.insertId;
    }

    let rmqIdWithLeastLoad = await oThis._selectRabbitMqWithLeastLoad();
    let cronParams = {
      topics: ['socket.' + socketCronProcessId],
      queues: ['socket_' + socketCronProcessId],
      prefetchCount: 25,
      wsid: oThis.wsServerIdentifier, //server identifier, set in env
      rmqCId: rmqIdWithLeastLoad
    };

    await new CronProcessModel()
      .update({
        params: JSON.stringify(cronParams)
      })
      .where({ id: socketCronProcessId })
      .fire();

    return socketCronProcessId;
  }

  /**
   * Selects Rabbit with least number of users.
   *
   *
   * @returns {Promise<*>}
   * @private
   */
  async _selectRabbitMqWithLeastLoad() {
    const oThis = this;

    await oThis._fetchSocketRmqNodes();

    let socketRmqIdWithLeastCount,
      leastLoadCount = 99999;

    for (let socketRmqId in oThis.rabbitLoadDetailsMap) {
      let currentCount = oThis.rabbitLoadDetailsMap[socketRmqId];
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

    for (let i = 0; i < socketRmqs.length; i++) {
      let socketRmqId = socketRmqs[i].id;
      oThis.rabbitLoadDetailsMap[socketRmqId] = oThis.rabbitLoadDetailsMap[socketRmqId] || 0;
    }
  }
}

module.exports = new ProcessIdsSelector();
