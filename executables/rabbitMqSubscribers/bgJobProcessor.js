const program = require('commander');

const rootPrefix = '../..',
  RabbitMqProcessorBase = require(rootPrefix + '/executables/rabbitMqSubscribers/Base'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  cronProcessesConstants = require(rootPrefix + '/lib/globalConstant/cronProcesses'),
  configStrategyConstants = require(rootPrefix + '/lib/globalConstant/configStrategy');

program.option('--cronProcessId <cronProcessId>', 'Cron table process ID').parse(process.argv);

program.on('--help', function() {
  logger.log('');
  logger.log('  Example:');
  logger.log('');
  logger.log('    node executables/rabbitMqSubscribers/bgJobProcessor.js --cronProcessId 3');
  logger.log('');
  logger.log('');
});

if (!program.cronProcessId) {
  program.help();
  process.exit(1);
}

/**
 * Class for background job processor.
 *
 * @class BgJobProcessor
 */
class BgJobProcessor extends RabbitMqProcessorBase {
  /**
   * Get rabbitMq config kind.
   *
   * @returns {string}
   * @private
   */
  get _rabbitMqConfigKind() {
    return configStrategyConstants.bgJobRabbitmq;
  }

  /**
   * Returns cron kind.
   *
   * @return {string}
   * @private
   */
  get _cronKind() {
    return cronProcessesConstants.bgJobProcessor;
  }

  /**
   * Returns queue prefix.
   *
   * @returns {string}
   * @private
   */
  get _queuePrefix() {
    return 'bg_';
  }
}

new BgJobProcessor({ cronProcessId: +program.cronProcessId }).perform();

setInterval(function() {
  logger.info('Ending the process. Sending SIGINT.');
  process.emit('SIGINT');
}, cronProcessesConstants.continuousCronRestartInterval);
