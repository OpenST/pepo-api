const program = require('commander');

const rootPrefix = '../..',
  RabbitMqProcessorBase = require(rootPrefix + '/executables/rabbitMqSubscribers/Base'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  machineKindConstants = require(rootPrefix + '/lib/globalConstant/machineKind'),
  rabbitMqProvider = require(rootPrefix + '/lib/providers/rabbitMq'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  cloudfrontWrapper = require(rootPrefix + '/lib/aws/CloudfrontWrapper'),
  cronProcessesConstants = require(rootPrefix + '/lib/globalConstant/cronProcesses'),
  configStrategyConstants = require(rootPrefix + '/lib/globalConstant/configStrategy');

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
 * Class for cdn cache invalidation processor
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
   * @returns {Boolean}
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

    logger.info('====Processing cache invalidation for paths', pathArray);

    await cloudfrontWrapper.invalidateCache(pathArray).catch(function(err) {
      logger.error('====Error for batch', pathArray);
      logger.error(err);
    });

    await basicHelper.sleep(2000 * 60); // Wait for cache invalidation to complete - 2s

    oThis.cacheInvalidationInProgress = false;

    return Promise.resolve({});
  }
}

new CdnCacheInvalidationProcessor({ cronProcessId: +program.cronProcessId }).perform();

setInterval(function() {
  logger.info('Ending the process. Sending SIGINT.');
  process.emit('SIGINT');
}, cronProcessesConstants.continuousCronRestartInterval);
