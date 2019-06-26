/**
 * This class is to process hooks specifically related to pepo campaigns.
 *
 * @module executables/hookProcessors/emailServiceApiCall
 */
const program = require('commander');

const rootPrefix = '../..',
  HookProcessorsBase = require(rootPrefix + '/executables/hookProcessors/Base'),
  SendTransactionalMail = require(rootPrefix + '/lib/email/hookProcessor/SendTransactionalMail'),
  EmailServiceAPICallHookModel = require(rootPrefix + '/app/models/mysql/EmailServiceAPICallHook'),
  emailServiceApiCallHookConstants = require(rootPrefix + '/lib/globalConstant/emailServiceApiCallHook'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  cronProcessesConstants = require(rootPrefix + '/lib/globalConstant/cronProcesses');

let ModelKlass;

program.option('--cronProcessId <cronProcessId>', 'Cron table process ID').parse(process.argv);

program.on('--help', function() {
  logger.log('');
  logger.log('  Example:');
  logger.log('');
  logger.log('    node executables/hookProcessors/emailServiceApiCall.js --cronProcessId 1');
  logger.log('');
  logger.log('');
});

const cronProcessId = +program.cronProcessId;

if (!cronProcessId) {
  program.help();
  process.exit(1);
}

/**
 * Class for EmailServiceApicall
 *
 * @class
 */
class EmailServiceApiCall extends HookProcessorsBase {
  /**
   * Constructor
   *
   * @constructor
   */
  constructor(params) {
    super(params);
  }

  /**
   * Run validations on input parameters.
   *
   * @return {Promise<void>}
   * @private
   */
  async _validateAndSanitize() {}

  /**
   * Function which will process the hook.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _processHook() {
    const oThis = this;

    let HookProcessorKlass = oThis.getHookProcessorClass(),
      response = await new HookProcessorKlass({ hook: oThis.hook }).perform();

    if (response.isSuccess()) {
      oThis.successResponse[oThis.hook.id] = response.data;
    } else {
      if (
        response.data['error'] == 'VALIDATION_ERROR' &&
        response.data['error_message'] &&
        typeof response.data['error_message'] === 'object' &&
        response.data['error_message']['subscription_status']
      ) {
        oThis.failedHookToBeIgnored[oThis.hook.id] = response.data;
      } else {
        oThis.failedHookToBeRetried[oThis.hook.id] = response.data;
      }
    }
  }

  /**
   * Returns the concrete hook processor class.
   *
   * @returns {any}
   */
  getHookProcessorClass() {
    const oThis = this;

    switch (oThis.hook.eventType) {
      case emailServiceApiCallHookConstants.sendTransactionalEmailEventType: {
        return SendTransactionalMail;
      }
      default: {
        throw new Error('Unsupported event type');
      }
    }
  }

  /**
   * Function which will mark the hook processed.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateStatusToProcessed() {
    const oThis = this;

    for (let hookId in oThis.hooksToBeProcessed) {
      if (oThis.successResponse[hookId]) {
        await new EmailServiceAPICallHookModel().markStatusAsProcessed(hookId, oThis.successResponse[hookId]);
      }
    }
  }

  /**
   * This function provides info whether the process has to exit.
   *
   * @returns {boolean}
   *
   * @private
   */
  _pendingTasksDone() {
    const oThis = this;

    return oThis.canExit;
  }

  /**
   * Get cron kind.
   *
   * @returns {string}
   *
   * @private
   */
  get _cronKind() {
    return cronProcessesConstants.emailServiceApiCallHookProcessor;
  }

  /**
   *  Hook model class
   *
   * @returns {*}
   */
  get hookModelKlass() {
    if (!ModelKlass) {
      ModelKlass = EmailServiceAPICallHookModel;
      return ModelKlass;
    }
    return ModelKlass;
  }
}

new EmailServiceApiCall({ cronProcessId: +cronProcessId }).perform();

setInterval(function() {
  logger.info('Ending the process. Sending SIGINT.');
  process.emit('SIGINT');
}, cronProcessesConstants.continuousCronRestartInterval);
