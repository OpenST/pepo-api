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
  logger.log('    node executables/rabbitMqSubscribers/pepoMobileEventJobProcessor.js --cronProcessId 12');
  logger.log('');
  logger.log('');
});

if (!program.cronProcessId) {
  program.help();
  process.exit(1);
}

/**
 * Class for pepoMobileEvent job processor.
 *
 * @class PepoMobileEventJobProcessor
 */
class PepoMobileEventJobProcessor extends RabbitMqProcessorBase {
  /**
   * Get rabbitMq provider.
   *
   * @returns {string}
   */
  getRmqProvider() {
    return rabbitMqProvider.getInstance(configStrategyConstants.pepoMobileEventRabbitmq, machineKindConstant.cronKind);
  }

  /**
   * Returns cron kind.
   *
   * @return {string}
   * @private
   */
  get _cronKind() {
    return cronProcessesConstants.pepoMobileEventJobProcessor;
  }

  /**
   * Returns queue prefix.
   *
   * @returns {string}
   * @private
   */
  get _queuePrefix() {
    return 'pepoMobileEvent_';
  }

  /**
   * Returns job processor factory.
   *
   * @returns {any}
   */
  get jobProcessorFactory() {
    return require(rootPrefix + '/lib/jobs/pepoMobileEvent/factory');
  }
}

new PepoMobileEventJobProcessor({ cronProcessId: +program.cronProcessId }).perform();

setInterval(function() {
  logger.info('Ending the process. Sending SIGINT.');
  process.emit('SIGINT');
}, cronProcessesConstants.continuousCronRestartInterval);
