const rootPrefix = '../..',
  RabbitMqEnqueueBase = require(rootPrefix + '/lib/rabbitMqEnqueue/Base'),
  machineKindConstant = require(rootPrefix + '/lib/globalConstant/machineKind'),
  UserSocketConnectionDetailsModel = require(rootPrefix + '/app/models/mysql/UserSocketConnectionDetails'),
  socketConnectionConstants = require(rootPrefix + '/lib/globalConstant/socketConnection'),
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

  get jobProcessorFactory() {
    return require(rootPrefix + '/lib/jobs/socket/factory');
  }

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
      let socket_server_id = userSocketConnDetails[i].socket_server_id;

      userSocketConnDetailsMap[socket_server_id] = userSocketConnDetailsMap[socket_server_id] || [];
      userSocketConnDetailsMap[socket_server_id].push(userSocketConnDetails[i].user_id);
    }

    console.log('userSocketConnDetailsMap-----', userSocketConnDetailsMap);

    for (let socket_server_id in userSocketConnDetailsMap) {
      userSocketConnDetailsMap[socket_server_id] = [...new Set(userSocketConnDetailsMap[socket_server_id])];
      let messageParams = {
        userIds: userSocketConnDetailsMap[socket_server_id],
        messagePayload: params.messagePayload
      };
      let promise = oThis.enqueue(socketConnectionConstants.getSocketRmqTopic(socket_server_id), messageParams, {});
      socketEnqueuePromiseArray.push(promise);
    }

    return Promise.all(socketEnqueuePromiseArray);
  }
}

module.exports = new SocketEnqueue();
