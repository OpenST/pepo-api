const rootPrefix = '../..',
  RabbitMqProcessorBase = require(rootPrefix + '/executables/rabbitMqSubscribers/Base'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  webSocketServerHelper = require(rootPrefix + '/lib/webSocket/helper'),
  webSocketCustomCache = require(rootPrefix + '/lib/webSocket/customCache'),
  machineKindConstants = require(rootPrefix + '/lib/globalConstant/machineKind'),
  socketRabbitMqProvider = require(rootPrefix + '/lib/providers/socketRabbitMq'),
  cronProcessesConstants = require(rootPrefix + '/lib/globalConstant/big/cronProcesses'),
  configStrategyConstants = require(rootPrefix + '/lib/globalConstant/config/configStrategy');

/**
 * Class for socket job processor.
 *
 * @class SocketJobProcessor
 */
class SocketJobProcessor extends RabbitMqProcessorBase {
  /**
   * Get rabbitMq provider.
   *
   * @returns {string}
   */
  getRmqProvider() {
    const oThis = this;

    return socketRabbitMqProvider.getInstance(
      configStrategyConstants.socketRabbitmq,
      oThis.rmqCId, // This is available in cronProcesses table's params column.
      machineKindConstants.cronKind
    );
  }

  /**
   * Returns cron kind.
   *
   * @return {string}
   * @private
   */
  get _cronKind() {
    return cronProcessesConstants.socketJobProcessor;
  }

  /**
   * Returns queue prefix.
   *
   * @returns {string}
   * @private
   */
  get _queuePrefix() {
    return '';
  }

  /**
   * This function checks if there are any pending tasks left or not.
   *
   * @returns {Boolean}
   */
  _pendingTasksDone() {
    const rmqTaskDone = super._pendingTasksDone();
    const websocketTaskDone = webSocketServerHelper.pendingTasksDone();
    logger.log('rmqTaskDone-----', rmqTaskDone);
    logger.log('websocketTaskDone-----', websocketTaskDone);

    return !!(rmqTaskDone && websocketTaskDone);
  }

  /**
   * Process message.
   *
   * @param {object} messageParams
   * @param {object} messageParams.message
   * @param {object} messageParams.message.payload
   * @param {array} messageParams.message.payload.userIds
   * @param {object} messageParams.message.payload.messagePayload
   *
   * @returns {Promise<>}
   *
   * @private
   */
  async _processMessage(messageParams) {
    const messageDetails = messageParams.message.payload,
      userIds = messageDetails.userIds,
      messagePayload = messageDetails.messagePayload;

    for (let index = 0; index < userIds.length; index++) {
      const socketObjectIds = webSocketCustomCache.getFromUserSocketConnDetailsIdsMap(userIds[index]);

      if (!socketObjectIds || socketObjectIds.length === 0) {
        continue;
      }
      for (let ind = 0; ind < socketObjectIds.length; ind++) {
        logger.log('userIds[index] ===------------==', index, userIds[index]);
        const socketObj = webSocketCustomCache.getFromSocketIdToSocketObjMap(socketObjectIds[ind]);
        socketObj.emit('pepo-stream', messagePayload);
      }
    }

    return Promise.resolve({});
  }
}

module.exports = SocketJobProcessor;
