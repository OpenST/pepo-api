const program = require('commander');

const rootPrefix = '../..',
  RabbitMqProcessorBase = require(rootPrefix + '/executables/rabbitMqSubscribers/Base'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  rabbitMqProvider = require(rootPrefix + '/lib/providers/rabbitMq'),
  cloudfrontWrapper = require(rootPrefix + '/lib/aws/CloudfrontWrapper'),
  machineKindConstants = require(rootPrefix + '/lib/globalConstant/machineKind'),
  cronProcessesConstants = require(rootPrefix + '/lib/globalConstant/big/cronProcesses'),
  configStrategyConstants = require(rootPrefix + '/lib/globalConstant/config/configStrategy');

program.option('--cronProcessId <cronProcessId>', 'Cron table process ID').parse(process.argv);

program.on('--help', function() {
  logger.log('');
  logger.log('  Example:');
  logger.log('');
  logger.log('    node executables/rabbitMqSubscribers/cdnCacheInvalidationProcessor.js --cronProcessId 6');
  logger.log('');
  logger.log('');
});

if (!program.cronProcessId) {
  program.help();
  process.exit(1);
}

/**
 * Class for cdn cache invalidation processor.
 *
 * @class CdnCacheInvalidationProcessor
 */
class CdnCacheInvalidationProcessor extends RabbitMqProcessorBase {
  /**
   * Get rabbitMq provider.
   *
   * @returns {string}
   */
  getRmqProvider() {
    return rabbitMqProvider.getInstance(configStrategyConstants.bgJobRabbitmq, machineKindConstants.cronKind);
  }

  /**
   * Returns cron kind.
   *
   * @return {string}
   * @private
   */
  get _cronKind() {
    return cronProcessesConstants.cdnCacheInvalidationProcessor;
  }

  /**
   * Returns queue prefix.
   *
   * @returns {string}
   * @private
   */
  get _queuePrefix() {
    return 'cdn_';
  }

  /**
   * This function checks if there are any pending tasks left or not.
   *
   * @returns {boolean}
   */
  _pendingTasksDone() {
    const oThis = this;

    const rmqTaskDone = super._pendingTasksDone();

    return !!(rmqTaskDone && !oThis.cacheInvalidationInProgress);
  }

  /**
   * Process message.
   *
   * @param {object} messageParams
   * @param {object} messageParams.message
   * @param {object} messageParams.message.payload
   * @param {object} messageParams.message.payload.pathArray
   *
   * @returns {Promise<>}
   *
   * @private
   */
  async _processMessage(messageParams) {
    const oThis = this;
    const messageDetails = messageParams.message.payload,
      pathArray = messageDetails.pathArray;

    oThis.cacheInvalidationInProgress = true;

    const rabbitMqSubscription = oThis.subscriptionTopicToDataMap[oThis.topics[0]];

    logger.info('====Processing cache invalidation for paths', pathArray);

    rabbitMqSubscription.stopConsumption();

    await cloudfrontWrapper.invalidateCache(pathArray).catch(function(err) {
      logger.error('====Error for batch', pathArray);
      logger.error(err);
    });

    oThis.cacheInvalidationInProgress = false;

    setTimeout(function() {
      rabbitMqSubscription.resumeConsumption();
    }, 1000 * 10);

    return Promise.resolve({});
  }
}

new CdnCacheInvalidationProcessor({ cronProcessId: +program.cronProcessId }).perform();

setInterval(function() {
  logger.info('Ending the process. Sending SIGINT.');
  process.emit('SIGINT');
}, cronProcessesConstants.continuousCronRestartInterval);
