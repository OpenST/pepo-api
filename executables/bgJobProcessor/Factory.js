const rootPrefix = '../..',
  BgJobProcessorBase = require(rootPrefix + '/executables/bgJobProcessor/Base'),
  bgJobConstant = require(rootPrefix + '/lib/globalConstant/bgJob'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  cronProcessesConstants = require(rootPrefix + '/lib/globalConstant/cronProcesses');

class BgJobProcessorFactory extends BgJobProcessorBase {
  /**
   * @constructor
   *
   * @param params
   * @param params.cronProcessId - cron process id
   */
  constructor(params) {
    super(params);
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
    const oThis = this;

    console.log('message params', messageParams);

    if (messageParams.message.kind === bgJobConstant.exampleKind) {
      return new oThis._exampleProcessor(messageParams).perform();
    } else {
      throw new Error('unrecognized messageParams: ' + JSON.stringify(messageParams));
    }
  }

  get _exampleProcessor() {
    return require(rootPrefix + '/executables/bgJobProcessor/Example');
  }
}

logger.step('BG JOB Processor Factory started.');

new BgJobProcessorFactory({ cronProcessId: 3 }).perform();

setInterval(function() {
  logger.info('Ending the process. Sending SIGINT.');
  process.emit('SIGINT');
}, cronProcessesConstants.continuousCronRestartInterval);
