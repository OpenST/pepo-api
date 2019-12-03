const program = require('commander');

const rootPrefix = '../..',
  RabbitMqProcessorBase = require(rootPrefix + '/executables/rabbitMqSubscribers/Base'),
  rabbitMqProvider = require(rootPrefix + '/lib/providers/rabbitMq'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  cronProcessesConstants = require(rootPrefix + '/lib/globalConstant/cronProcesses'),
  configStrategyConstants = require(rootPrefix + '/lib/globalConstant/configStrategy'),
  machineKindConstant = require(rootPrefix + '/lib/globalConstant/machineKind');

program.option('--cronProcessId <cronProcessId>', 'Cron table process ID').parse(process.argv);

program.on('--help', function() {
  logger.log('');
  logger.log('  Example:');
  logger.log('');
  logger.log('    node executables/rabbitMqSubscribers/pixelsJobProcessor.js --cronProcessId 5');
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
 * @class PixelsJobProcessor
 */
class PixelsJobProcessor extends RabbitMqProcessorBase {
  /**
   * Get rabbitMq provider.
   *
   * @returns {string}
   */
  getRmqProvider() {
    return rabbitMqProvider.getInstance(configStrategyConstants.pixelsRabbitmq, machineKindConstant.cronKind);
  }

  /**
   * Returns cron kind.
   *
   * @return {string}
   * @private
   */
  get _cronKind() {
    return cronProcessesConstants.pixelsJobProcessor;
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
    return require(rootPrefix + '/lib/jobs/pixels/factory');
  }
}

new PixelsJobProcessor({ cronProcessId: +program.cronProcessId }).perform();

setInterval(function() {
  logger.info('Ending the process. Sending SIGINT.');
  process.emit('SIGINT');
}, cronProcessesConstants.continuousCronRestartInterval);
