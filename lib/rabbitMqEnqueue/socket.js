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
      let socket_identifier = userSocketConnDetails[i].socket_identifier;

      userSocketConnDetailsMap[socket_identifier] = userSocketConnDetailsMap[socket_identifier] || [];
      userSocketConnDetailsMap[socket_identifier].push(userSocketConnDetails[i].user_id);
    }

    console.log('userSocketConnDetailsMap-----', userSocketConnDetailsMap);

    for (let socket_identifier in userSocketConnDetailsMap) {
      userSocketConnDetailsMap[socket_identifier] = [...new Set(userSocketConnDetailsMap[socket_identifier])];
      let messageParams = {
        userIds: userSocketConnDetailsMap[socket_identifier],
        messagePayload: params.messagePayload
      };
      let promise = oThis.enqueue(socketConnectionConstants.getSocketRmqTopic(socket_identifier), messageParams, {});
      socketEnqueuePromiseArray.push(promise);
    }

    return Promise.all(socketEnqueuePromiseArray);
  }
}

module.exports = new SocketEnqueue();
