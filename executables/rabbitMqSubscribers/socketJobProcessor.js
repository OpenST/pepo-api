const rootPrefix = '../..',
  RabbitMqProcessorBase = require(rootPrefix + '/executables/rabbitMqSubscribers/Base'),
  socketRabbitMqProvider = require(rootPrefix + '/lib/providers/socketRabbitMq'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  webSocketCustomCache = require(rootPrefix + '/lib/webSocket/customCache'),
  webSocketServerHelper = require(rootPrefix + '/lib/webSocket/helper'),
  cronProcessesConstants = require(rootPrefix + '/lib/globalConstant/cronProcesses'),
  configStrategyConstants = require(rootPrefix + '/lib/globalConstant/configStrategy'),
  machineKindConstant = require(rootPrefix + '/lib/globalConstant/machineKind');

/**
 * Class for socket job processor.
 *
 * @class SocketJobProcessor
 */
class SocketJobProcessor extends RabbitMqProcessorBase {
  /**
   * Constructor for rabbitMq processor base.
   *
   * @param {object} params
   * @param {number} params.cronProcessId
   *
   * @constructor
   */
  constructor(params) {
    super(params);
  }

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
      machineKindConstant.cronKind
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
    let rmqTaskDone = super._pendingTasksDone();
    let websocketTaskDone = webSocketServerHelper.pendingTasksDone();
    console.log('rmqTaskDone-----', rmqTaskDone);
    console.log('websocketTaskDone-----', websocketTaskDone);
    if (rmqTaskDone && websocketTaskDone) {
      return true;
    }
    return false;
  }

  /**
   * Process message.
   *
   * @param {object} messageParams
   * @param {string} messageParams.kind: kind of the bg job
   * @param {object} messageParams.payload
   *
   * @returns {Promise<>}
   *
   * @private
   */
  _processMessage(messageParams) {
    const oThis = this,
      messageDetails = messageParams.message.payload,
      userIds = messageDetails.userIds,
      messagePayload = messageDetails.messagePayload;

    for (let j = 0; j < userIds.length; j++) {
      let socketObjectIds = webSocketCustomCache.getFromUserSocketConnDetailsIdsMap(userIds[j]);

      if (!socketObjectIds || socketObjectIds.length == 0) {
        continue;
      }
      for (let i = 0; i < socketObjectIds.length; i++) {
        logger.log('userIds[j] ===------------==', j, userIds[j]);
        let socketObj = webSocketCustomCache.getFromSocketObjsMap(socketObjectIds[i]);
        socketObj.emit('pepo-stream', JSON.stringify(messagePayload));
      }
    }

    return Promise.resolve({});
  }
}

module.exports = SocketJobProcessor;
