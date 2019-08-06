const rootPrefix = '../..',
  RabbitMqProcessorBase = require(rootPrefix + '/executables/rabbitMqSubscribers/Base'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  cronProcessesConstants = require(rootPrefix + '/lib/globalConstant/cronProcesses'),
  configStrategyConstants = require(rootPrefix + '/lib/globalConstant/configStrategy');

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
   * @param {number} params.socketObject - Socket connection object, where to emit message.
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.userSocketIdsMap = params.userSocketIdsMap;
    oThis.socketObjsMap = params.socketObjsMap;
  }

  /**
   * Get rabbitMq config kind.
   *
   * @returns {string}
   * @private
   */
  get _rabbitMqConfigKind() {
    return configStrategyConstants.socketRabbitmq;
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

    for (let j = 0; j < userIds.length; j++) {
      let socketObjectIds = oThis.userSocketIdsMap[userIds[j]];
      if (!socketObjectIds || socketObjectIds.length == 0) {
        continue;
      }
      for (let i = 0; i < socketObjectIds.length; i++) {
        console.log('-------------------------------------');
        let socketObj = oThis.socketObjsMap[socketObjectIds[i]];
        socketObj.emit('server-event', JSON.stringify(messagePayload));
      }
    }

    return Promise.resolve({});
  }
}

module.exports = SocketJobProcessor;
