const program = require('commander');

const rootPrefix = '../..',
  BgJobProcessorBase = require(rootPrefix + '/executables/bgJobProcessor/Base'),
  bgJobConstant = require(rootPrefix + '/lib/globalConstant/bgJob'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  cronProcessesConstants = require(rootPrefix + '/lib/globalConstant/cronProcesses');

program.option('--cronProcessId <cronProcessId>', 'Cron table process ID').parse(process.argv);

program.on('--help', function() {
  logger.log('');
  logger.log('  Example:');
  logger.log('');
  logger.log('    node executables/bgJobProcessor/Factory.js --cronProcessId 3');
  logger.log('');
  logger.log('');
});

if (!program.cronProcessId) {
  program.help();
  process.exit(1);
}

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

    if (messageParams.message.kind === bgJobConstant.afterSignUpJobTopic) {
      return new oThis._afterSignupJobProcessor(messageParams.message.payload).perform();
    } else if (messageParams.message.kind === bgJobConstant.twitterFriendsSyncJobTopic) {
      return new oThis._twitterFriendsSyncJobProcessor(messageParams.message.payload).perform();
    } else if (messageParams.message.kind === bgJobConstant.imageResizer) {
      return new oThis._imageResizer(messageParams.message.payload).perform();
    } else if (messageParams.message.kind === bgJobConstant.ostWebhookJobTopic) {
      return new oThis._ostWebhookJobTopic(messageParams.message.payload).perform();
    } else {
      throw new Error('unrecognized messageParams: ' + JSON.stringify(messageParams));
    }
  }

  get _afterSignupJobProcessor() {
    return require(rootPrefix + '/executables/bgJobProcessor/AfterSignUpJob');
  }

  get _twitterFriendsSyncJobProcessor() {
    return require(rootPrefix + '/lib/twitterFriendSync/Start');
  }

  get _imageResizer() {
    return require(rootPrefix + '/lib/resize/image');
  }

  get _ostWebhookJobTopic() {
    return require(rootPrefix + '/app/services/ostEvents/Process');
  }
}

logger.step('BG JOB Processor Factory started.');

new BgJobProcessorFactory({ cronProcessId: +program.cronProcessId }).perform();

setInterval(function() {
  logger.info('Ending the process. Sending SIGINT.');
  process.emit('SIGINT');
}, cronProcessesConstants.continuousCronRestartInterval);
