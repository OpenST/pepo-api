/**
 * This class is to process push notification hooks.
 *
 * @module executables/hookProcessors/pushNotification
 */
const program = require('commander');

const rootPrefix = '../..',
  NotificationHookModel = require(rootPrefix + '/app/models/mysql/NotificationHook'),
  ErrorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  CronProcessModel = require(rootPrefix + '/app/models/mysql/CronProcesses'),
  HookProcessorsBase = require(rootPrefix + '/executables/hookProcessors/Base'),
  PushNotificationProcessor = require(rootPrefix + '/lib/pushNotification/Processor'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  cronProcessesConstants = require(rootPrefix + '/lib/globalConstant/cronProcesses'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

program.option('--cronProcessId <cronProcessId>', 'Cron table process ID').parse(process.argv);

program.on('--help', function() {
  logger.log('');
  logger.log('  Example:');
  logger.log('');
  logger.log('    node executables/hookProcessors/pushNotification.js --cronProcessId 3');
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
    console.log('response-----------', oThis.successResponse);
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
        await new NotificationHookModel().markStatusAsProcessed(
          hookId,
          oThis.successResponse[hookId],
          oThis.successResponse[hookId]
        );
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
