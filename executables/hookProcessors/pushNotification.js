/**
 * This class is to process push notification hooks.
 *
 * @module executables/hookProcessors/pushNotification
 */
const program = require('commander');

const rootPrefix = '../..',
  NotificationHookModel = require(rootPrefix + '/app/models/mysql/NotificationHook'),
  HookProcessorsBase = require(rootPrefix + '/executables/hookProcessors/Base'),
  PushNotificationProcessor = require(rootPrefix + '/lib/pushNotification/Processor'),
  cronProcessesConstants = require(rootPrefix + '/lib/globalConstant/cronProcesses'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

program.option('--cronProcessId <cronProcessId>', 'Cron table process ID').parse(process.argv);

program.on('--help', function() {
  logger.log('');
  logger.log('  Example:');
  logger.log('');
  logger.log('    node executables/hookProcessors/pushNotification.js --cronProcessId 7');
  logger.log('');
  logger.log('');
});

const cronProcessId = +program.cronProcessId;

if (!cronProcessId) {
  program.help();
  process.exit(1);
}

let ModelKlass;

/**
 * Class for PushNotification
 *
 * @class
 */
class PushNotification extends HookProcessorsBase {
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

    logger.step('_processHook called for: ', oThis.hook);

    let HookProcessorKlass = oThis.getHookProcessorClass(),
      response = await new HookProcessorKlass({ hook: oThis.hook }).perform();

    logger.log('HookProcessorKlass::response  =========================', response);

    // TODO @dhananjay - error handling on basis of API responses.
    if (response.isSuccess()) {
      let formattedFirebaseAPIResponse = response.data;
      if (formattedFirebaseAPIResponse.failureResponseCount > 0) {
        await oThis._afterProcessHooks(oThis.hook, formattedFirebaseAPIResponse.responseMap);
      } else {
        oThis.successResponse[oThis.hook.id] = response;
      }
    } else {
      logger.error('ERROR----------------response------------------', response);
      oThis.failedHookToBeRetried[oThis.hook.id] = response.data;
    }
  }

  /**
   * Returns the concrete hook processor class.
   *
   * @returns {any}
   */
  getHookProcessorClass() {
    const oThis = this;

    return PushNotificationProcessor;
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
        await new NotificationHookModel().markStatusAsProcessed(hookId);
      }
    }
  }

  /**
   * After hooks process.
   *
   * @param hook
   * @param responseMap
   * @returns {Promise<void>}
   * @private
   */
  async _afterProcessHooks(hook, responseMap) {
    const oThis = this;
  }

  /**
   * Get cron kind.
   *
   * @returns {string}
   *
   * @private
   */
  get _cronKind() {
    return cronProcessesConstants.pushNotificationHookProcessor;
  }

  /**
   *  Hook model class
   *
   * @returns {*}
   */
  get hookModelKlass() {
    if (!ModelKlass) {
      ModelKlass = NotificationHookModel;
      return ModelKlass;
    }
    return ModelKlass;
  }
}

new PushNotification({ cronProcessId: +cronProcessId }).perform();

setInterval(function() {
  logger.info('Ending the process. Sending SIGINT.');
  process.emit('SIGINT');
}, cronProcessesConstants.continuousCronRestartInterval);
