const rootPrefix = '../..',
  RabbitMqProcessorBase = require(rootPrefix + '/executables/rabbitMqSubscribers/Base'),
  socketRabbitMqProvider = require(rootPrefix + '/lib/providers/socketRabbitMq'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  webSocketCustomCache = require(rootPrefix + '/lib/webSocket/customCache'),
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

    logger.log('Message params =====', messageParams);
    logger.log('userIds ===------------==', userIds);

    logger.log('webSocketCustomCache.userSocketIdsMap ===------------==', webSocketCustomCache.userSocketIdsMap);

    for (let j = 0; j < userIds.length; j++) {
      logger.log('userIds[j] ===------------==', j, userIds[j]);
      let socketObjectIds = webSocketCustomCache.getFromUserSocketIdsMap(userIds[j]);
      logger.log('socketObjectIds ===------------==', socketObjectIds);
      if (!socketObjectIds || socketObjectIds.length == 0) {
        continue;
      }
      for (let i = 0; i < socketObjectIds.length; i++) {
        console.log('-------------------------------------');
        let socketObj = webSocketCustomCache.getFromSocketObjsMap(socketObjectIds[i]);
        socketObj.emit('server-event', JSON.stringify(messagePayload));
      }
    }

    return Promise.resolve({});
  }
}

module.exports = SocketJobProcessor;
