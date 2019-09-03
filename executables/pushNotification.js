/**
 * This class is to process push notification hooks.
 *
 * @module executables/hookProcessors/pushNotification
 */
const program = require('commander');

const rootPrefix = '../..',
  basicHelper = require(rootPrefix + '/helpers/basic'),
  NotificationHookModel = require(rootPrefix + '/app/models/mysql/NotificationHook'),
  CronBase = require(rootPrefix + '/executables/CronBase'),
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

/**
 * Class for PushNotification
 *
 * @class
 */
class PushNotification extends CronBase {
  /**
   * @constructor
   *
   * @param {Object} params
   * @param {boolean} [params.processFailed] - boolean tells if this iteration is to retry failed hooks or to process fresh ones
   *
   */
  constructor(params) {
    super(params);
    const oThis = this;

    oThis.processFailed = params.processFailed;
    oThis.currentTimeStamp = Math.round(Date.now() / 1000);

    oThis.lockIdentifier = oThis.currentTimeStamp;

    oThis.hook = null;
    oThis.hooksToBeProcessed = {};
    oThis.successResponse = {};
    oThis.failedHookToBeRetried = {};

    oThis.processableHooksPresentFlag = true;
    oThis.canExit = true;
  }

  /**
   * Run validations on input parameters.
   *
   * @return {Promise<void>}
   * @private
   */
  async _validateAndSanitize() {}

  /**
   * Start cron
   *
   * @returns
   */
  async _start() {
    const oThis = this;

    while (true) {
      if (oThis.stopPickingUpNewWork) {
        oThis.canExit = true;
        break;
      }

      oThis.canExit = false;

      // Add validations here.
      await oThis._validateAndSanitize();

      // Acquire lock
      await oThis._acquireLock();

      if (oThis.processableHooksPresentFlag) {
        logger.log('Processing hooks...');

        // Fetch the locked hooks.
        await oThis._fetchLockedHooks();

        // Process these Hooks.
        await oThis._processHooks();

        // Mark Hooks as processed
        await oThis._updateStatusToProcessed();

        // For hooks which failed, mark them as failed
        await oThis.releaseLockAndUpdateStatusForNonProcessedHooks();
      } else {
        logger.log('No processable hook present..');
        logger.log('Sleeping Now...');
        await basicHelper.sleep(5000);
      }
    }
  }

  /**
   * Acquire lock.
   *
   * @Sets oThis.processableHooksPresentFlag
   *
   * @private
   * @returns {Promise<void>}
   */
  async _acquireLock() {
    const oThis = this;

    if (oThis.processFailed) {
      //Acquire Lock on failed hooks
      let acquireLockResponse = await oThis._acquireLockOnFailedHooks();
      if (acquireLockResponse.affectedRows === 0) {
        oThis.processableHooksPresentFlag = false;
        return;
      }
    } else {
      //Acquire lock on fresh hooks
      let acquireLockResponse = await oThis._acquireLockOnFreshHooks();
      if (acquireLockResponse.affectedRows === 0) {
        oThis.processableHooksPresentFlag = false;
        return;
      }
    }
    oThis.processableHooksPresentFlag = true;
  }

  /**
   * Fetch locked hooks for processing.
   *
   * @returns {Promise<void>}
   */
  async _fetchLockedHooks() {
    const oThis = this;

    oThis.hooksToBeProcessed = await new NotificationHookModel().fetchLockedHooks(oThis.lockIdentifier);
  }

  /**
   * Process the fetched hooks
   *
   * @returns {Promise<void>}
   * @private
   */
  async _processHooks() {
    const oThis = this;

    for (let hookId in oThis.hooksToBeProcessed) {
      oThis.hook = oThis.hooksToBeProcessed[hookId];

      await oThis._processHook().catch(function(err) {
        oThis.failedHookToBeRetried[oThis.hook.id] = {
          exception: err
        };
      });
    }
  }

  /**
   * Acquire lock on fresh hooks.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _acquireLockOnFreshHooks() {
    const oThis = this;

    return new NotificationHookModel().acquireLocksOnFreshHooks(oThis.lockIdentifier);
  }

  /**
   * Acquire lock on failed hooks
   *
   * @returns {Promise<void>}
   * @private
   */
  async _acquireLockOnFailedHooks() {
    const oThis = this;

    return new NotificationHookModel().acquireLocksOnFailedHooks();
  }

  /**
   * Release lock and update status for non processed hooks
   *
   * @returns {Promise<void>}
   */
  async releaseLockAndUpdateStatusForNonProcessedHooks() {
    const oThis = this;
  }

  /**
   * This function provides info whether the process has to exit.
   *
   * @returns {boolean}
   * @private
   */
  _pendingTasksDone() {
    const oThis = this;

    return oThis.canExit;
  }

  /**
   * Function which will process the hook.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _processHook() {
    const oThis = this;

    logger.step('_processHook called for: ', oThis.hook);

    let pushNotificationProcessorRsp = await new PushNotificationProcessor({ hook: oThis.hook }).perform();

    logger.log('HookProcessorKlass::response  =========================', pushNotificationProcessorRsp);

    if (pushNotificationProcessorRsp.isSuccess()) {
      let firebaseAPIResponse = pushNotificationProcessorRsp.data;
      if (firebaseAPIResponse.failureResponseCount > 0) {
        await oThis._afterProcessHook(oThis.hook, firebaseAPIResponse.responseMap);
      } else {
        oThis.successResponse[oThis.hook.id] = pushNotificationProcessorRsp;
      }
    } else {
      logger.error('ERROR----------------response------------------', pushNotificationProcessorRsp);
      oThis.failedHookToBeRetried[oThis.hook.id] = pushNotificationProcessorRsp.data;
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
        await new NotificationHookModel().markStatusAsProcessed(hookId);
      }
    }
  }

  /**
   * After hooks process.
   *
   * @param hook
   * @param userDeviceIdToResponseMap
   * @returns {Promise<void>}
   * @private
   */
  async _afterProcessHook(hook, userDeviceIdToResponseMap) {
    const oThis = this;

    let userDevicesIdsToBeReinserted = [];

    for (let userDeviceId in userDeviceIdToResponseMap) {
      let response = userDeviceIdToResponseMap[userDeviceId];
      if (response.success === 'false') {
        switch (response.error.code) {
          case 'messaging/invalid-argument':
            break;

          case 'messaging/unregistered':
            break;

          case 'messaging/third_party_auth_error':
            break;

          default:
            userDevicesIdsToBeReinserted.push(userDeviceId);
        }
      }
    }
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
}

new PushNotification({ cronProcessId: +cronProcessId }).perform();

setInterval(function() {
  logger.info('Ending the process. Sending SIGINT.');
  process.emit('SIGINT');
}, cronProcessesConstants.continuousCronRestartInterval);
