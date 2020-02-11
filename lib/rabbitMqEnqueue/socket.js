const rootPrefix = '../..',
  RabbitMqEnqueueBase = require(rootPrefix + '/lib/rabbitMqEnqueue/Base'),
  CronProcessesDetailsByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/CronProcessesDetailsByIds'),
  UserSocketConnectionDetailsModel = require(rootPrefix + '/app/models/mysql/socket/UserSocketConnectionDetails'),
  machineKindConstants = require(rootPrefix + '/lib/globalConstant/machineKind'),
  socketRabbitMqProvider = require(rootPrefix + '/lib/providers/socketRabbitMq'),
  configStrategyConstants = require(rootPrefix + '/lib/globalConstant/config/configStrategy'),
  socketConnectionConstants = require(rootPrefix + '/lib/globalConstant/socket/socketConnection');

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
      machineKindConstants.appServerKind
    );
  }

  /**
   * Publish to socket.
   * NOTE - this overrides 'enqueue' of base class
   *
   * @param {object} params
   * @param {array<number>} params.recipient_user_ids: user ids
   * @param {object} params.payload: messagePayload to be published
   *
   * @returns {Promise<any[]>}
   */
  async publishToSocket(params) {
    const oThis = this;

    const userIds = params.recipient_user_ids,
      userSocketConnDetailsMap = {},
      socketEnqueuePromiseArray = [];

    const userSocketConnDetails = await new UserSocketConnectionDetailsModel()
      .select('*')
      .where({
        user_id: userIds,
        status: socketConnectionConstants.invertedStatuses[socketConnectionConstants.connectedStatus]
      })
      .fire();

    for (let index = 0; index < userSocketConnDetails.length; index++) {
      const socketIdentifier = userSocketConnDetails[index].socket_identifier;

      userSocketConnDetailsMap[socketIdentifier] = userSocketConnDetailsMap[socketIdentifier] || [];
      userSocketConnDetailsMap[socketIdentifier].push(userSocketConnDetails[index].user_id);
    }

    for (const socketIdentifier in userSocketConnDetailsMap) {
      userSocketConnDetailsMap[socketIdentifier] = [...new Set(userSocketConnDetailsMap[socketIdentifier])];
      const messageParams = {
        userIds: userSocketConnDetailsMap[socketIdentifier],
        messagePayload: params.payload
      };
      const promise = oThis.enqueue(socketConnectionConstants.getSocketRmqTopic(socketIdentifier), messageParams, {
        socketIdentifier: socketIdentifier
      });
      socketEnqueuePromiseArray.push(promise);
    }

    return Promise.all(socketEnqueuePromiseArray);
  }
}

module.exports = new SocketEnqueue();
