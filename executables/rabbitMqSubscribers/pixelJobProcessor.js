const program = require('commander');

const rootPrefix = '../..',
  RabbitMqProcessorBase = require(rootPrefix + '/executables/rabbitMqSubscribers/Base'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  rabbitMqProvider = require(rootPrefix + '/lib/providers/rabbitMq'),
  machineKindConstants = require(rootPrefix + '/lib/globalConstant/machineKind'),
  cronProcessesConstants = require(rootPrefix + '/lib/globalConstant/cronProcesses'),
  configStrategyConstants = require(rootPrefix + '/lib/globalConstant/configStrategy');

program.option('--cronProcessId <cronProcessId>', 'Cron table process ID').parse(process.argv);

program.on('--help', function() {
  logger.log('');
  logger.log('  Example:');
  logger.log('');
  logger.log('    node executables/rabbitMqSubscribers/pixelJobProcessor.js --cronProcessId 5');
  logger.log('');
  logger.log('');
});

if (!program.cronProcessId) {
  program.help();
  process.exit(1);
}

/**
 * Class for pixels job processor.
 *
 * @class PixelJobProcessor
 */
class PixelJobProcessor extends RabbitMqProcessorBase {
  /**
   * Get rabbitMq provider.
   *
   * @returns {string}
   */
  getRmqProvider() {
    return rabbitMqProvider.getInstance(configStrategyConstants.pixelRabbitmq, machineKindConstants.cronKind);
  }

  /**
   * Returns cron kind.
   *
   * @return {string}
   * @private
   */
  get _cronKind() {
    return cronProcessesConstants.pixelJobProcessor;
  }

  /**
   * Returns queue prefix.
   *
   * @returns {string}
   * @private
   */
  get _queuePrefix() {
    return 'pixels_';
  }

  /**
   * Returns job processor factory.
   *
   * @returns {any}
   */
  get jobProcessorFactory() {
    return require(rootPrefix + '/lib/jobs/pixel/factory');
  }
}

new PixelJobProcessor({ cronProcessId: +program.cronProcessId }).perform();

setInterval(function() {
  logger.info('Ending the process. Sending SIGINT.');
  process.emit('SIGINT');
}, cronProcessesConstants.continuousCronRestartInterval);
