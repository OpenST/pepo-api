const rootPrefix = '../..',
  RabbitMqEnqueueBase = require(rootPrefix + '/lib/rabbitMqEnqueue/Base'),
  machineKindConstant = require(rootPrefix + '/lib/globalConstant/machineKind'),
  socketRabbitMqProvider = require(rootPrefix + '/lib/providers/socketRabbitMq'),
  CronProcessesDetailsByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/CronProcessesDetailsByIds'),
  UserSocketConnectionDetailsModel = require(rootPrefix + '/app/models/mysql/UserSocketConnectionDetails'),
  socketConnectionConstants = require(rootPrefix + '/lib/globalConstant/socketConnection'),
  configStrategyConstants = require(rootPrefix + '/lib/globalConstant/configStrategy');

/**
 * Class for socket job enqueue.
 *
 * @class SocketEnqueue
 */
class SocketEnqueue extends RabbitMqEnqueueBase {
  get jobProcessorFactory() {
    return require(rootPrefix + '/lib/jobs/socket/factory');
  }

  /**
   * Get rabbitMq provider.
   *
   * @returns {string}
   */
  async getRmqProvider(socketIdentifier) {
    const cronProcessesCacheRsp = await new CronProcessesDetailsByIdsCache({ ids: [socketIdentifier] }).fetch(),
      cronProcessParams = cronProcessesCacheRsp.data[socketIdentifier].params;

    return socketRabbitMqProvider.getInstance(
      configStrategyConstants.socketRabbitmq,
      cronProcessParams.rmqCId,
      machineKindConstant.appServerKind
    );
  }

  /**
   * Publish to socket
   * NOTE - this overrides 'enqueue' of base class
   *
   *
   * @param params
   * @param {Array} params.userIds - user ids
   * @param {Object} params.messagePayload - messagePayload to be publish
   * @returns {Promise<any[]>}
   */
  async publishToSocket(params) {
    const oThis = this;
    let userIds = params.userIds,
      userSocketConnDetailsMap = {},
      socketEnqueuePromiseArray = [];

    let userSocketConnDetails = await new UserSocketConnectionDetailsModel()
      .select('*')
      .where({
        user_id: userIds,
        status: socketConnectionConstants.invertedStatuses[socketConnectionConstants.connectedStatus]
      })
      .fire();

    for (let i = 0; i < userSocketConnDetails.length; i++) {
      let socketIdentifier = userSocketConnDetails[i].socket_identifier;

      userSocketConnDetailsMap[socketIdentifier] = userSocketConnDetailsMap[socketIdentifier] || [];
      userSocketConnDetailsMap[socketIdentifier].push(userSocketConnDetails[i].user_id);
    }

    for (let socketIdentifier in userSocketConnDetailsMap) {
      userSocketConnDetailsMap[socketIdentifier] = [...new Set(userSocketConnDetailsMap[socketIdentifier])];
      let messageParams = {
        userIds: userSocketConnDetailsMap[socketIdentifier],
        messagePayload: params.messagePayload
      };
      let promise = oThis.enqueue(socketConnectionConstants.getSocketRmqTopic(socketIdentifier), messageParams, {
        socketIdentifier: socketIdentifier
      });
      socketEnqueuePromiseArray.push(promise);
    }

    return Promise.all(socketEnqueuePromiseArray);
  }
}

module.exports = new SocketEnqueue();
