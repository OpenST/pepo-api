/**
 * This class is to process push notification hooks.
 *
 * @module executables/pushNotification/hookProcessor
 */
const program = require('commander');

const rootPrefix = '../..',
  CronBase = require(rootPrefix + '/executables/CronBase'),
  NotificationHookModel = require(rootPrefix + '/app/models/mysql/NotificationHook'),
  PushNotificationProcessor = require(rootPrefix + '/lib/pushNotification/Processor'),
  UserDeviceModel = require(rootPrefix + '/app/models/mysql/UserDevice'),
  cronProcessesConstants = require(rootPrefix + '/lib/globalConstant/cronProcesses'),
  notificationHookConstants = require(rootPrefix + '/lib/globalConstant/notificationHook'),
  userDeviceConstants = require(rootPrefix + '/lib/globalConstant/userDevice'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

program.option('--cronProcessId <cronProcessId>', 'Cron table process ID').parse(process.argv);

program.on('--help', function() {
  logger.log('');
  logger.log('  Example:');
  logger.log('');
  logger.log('    node executables/pushNotification/hookProcessor.js --cronProcessId 7');
  logger.log('');
  logger.log('');
});

const cronProcessId = +program.cronProcessId;

if (!cronProcessId) {
  program.help();
  process.exit(1);
}

/**
 * Class for HookProcessor
 *
 * @class
 */
class HookProcessor extends CronBase {
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

    if (oThis.processFailed) {
      oThis.increaseRetryCount = true;
    } else {
      oThis.increaseRetryCount = false;
    }

    oThis.hook = null;
    oThis.hooksToBeProcessed = {};

    oThis.processableHooksPresentFlag = true;
    oThis.canExit = true;
  }

  /**
   * Start cron
   *
   * @returns
   */
  async _start() {
    const oThis = this;

    while (true) {
      oThis.currentTimeStamp = Math.round(Date.now() / 1000);
      oThis.lockIdentifier = oThis.currentTimeStamp;

      if (oThis.stopPickingUpNewWork) {
        oThis.canExit = true;
        break;
      }

      oThis.canExit = false;

      // Acquire lock
      await oThis._acquireLock();

      if (oThis.processableHooksPresentFlag) {
        logger.log('Processing hooks...');

        // Fetch the locked hooks.
        await oThis._fetchLockedHooks();

        // Process these Hooks.
        await oThis._processHooks();
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

      await oThis._processHook().catch(async function(err) {
        const errorIdentifierStr = `firebase_error:e_pn_1`,
          debugOptions = {
            error: err
          };
        await oThis._notifyErrorStates(errorIdentifierStr, debugOptions);

        await new NotificationHookModel().updateStatusAndInsertResponse(
          hookId,
          notificationHookConstants.failedStatus,
          err,
          oThis.increaseRetryCount
        );
      });
    }
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
      let firebaseAPIResponse = pushNotificationProcessorRsp.data,
        statusToBeInserted = null;

      if (firebaseAPIResponse.failureResponseCount > 0) {
        statusToBeInserted = notificationHookConstants.failedStatus;
        await oThis._afterProcessHook(oThis.hook, firebaseAPIResponse.responseMap);
      } else {
        statusToBeInserted = notificationHookConstants.successStatus;
      }

      return new NotificationHookModel().updateStatusAndInsertResponse(
        oThis.hook.id,
        statusToBeInserted,
        firebaseAPIResponse,
        oThis.increaseRetryCount
      );
    } else {
      return Promise.reject(pushNotificationProcessorRsp);
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

    let userDeviceIds = [];

    for (let userDeviceId in userDeviceIdToResponseMap) {
      userDeviceIds.push(userDeviceId); // TODO: Temp Code. Remove after testing. - Anagha
      let response = userDeviceIdToResponseMap[userDeviceId];
      if (response.success == false) {
        switch (response.error.code) {
          case notificationHookConstants.tokenNotRegisteredErrorCode:
          case notificationHookConstants.unregisteredErrorCode:
            logger.error(
              'Error:: tokenNotRegisteredErrorCode/unregisteredErrorCode ---------------',
              response.error.code
            );

            await new UserDeviceModel()
              .update({ status: userDeviceConstants.invertedStatuses[userDeviceConstants.expiredStatus] })
              .where({
                id: userDeviceId
              })
              .fire();

            await UserDeviceModel.flushCache({ id: userDeviceId });

            break;

          case notificationHookConstants.serverUnavailableErrorCode:
            logger.error('Error----------------------------', response.error.code);
            logger.log('serverUnavailable...\nSleeping Now...');
            userDeviceIds.push(userDeviceId);
            await basicHelper.sleep(5000);
            break;

          default:
            logger.error('Error::default----------------------------', response);

            const errorIdentifierStr = `firebase_error:${response.error.code}:e_pn_3`,
              debugOptions = {
                notificationHooksRowId: hook.id,
                userDeviceId: userDeviceId,
                response: response
              };
            await oThis._notifyErrorStates(errorIdentifierStr, debugOptions);
        }
      }
    }

    if (userDeviceIds.length) {
      await oThis._updateFailedHooks(userDeviceIds);
    }
  }

  /**
   * Insert entry in error_logs table for firebase error state.
   *
   * @param {string} errorIdentifier: errorIdentifier
   * @param {object} debugOptions:  debugOptions
   *
   * @returns {Promise<void>}
   * @private
   */
  async _notifyErrorStates(errorIdentifier, debugOptions) {
    logger.error('errorIdentifier----------', errorIdentifier);

    const errorObject = responseHelper.error({
      internal_error_identifier: errorIdentifier,
      api_error_identifier: 'firebase_error',
      debug_options: debugOptions
    });
    await createErrorLogsEntry.perform(errorObject, errorLogsConstants.mediumSeverity);
  }

  /**
   * Re-insert into hooks table.
   *
   * @param userDevicesIdsToBeReinserted
   * @returns {Promise<any>}
   * @private
   */
  async _updateFailedHooks(userDevicesIdsToBeReinserted) {
    const oThis = this;

    let currentRetryCount = oThis.hook.retryCount,
      status = null;

    if (currentRetryCount === notificationHookConstants.retryLimitForFailedHooks) {
      status = notificationHookConstants.invertedStatuses[notificationHookConstants.completelyFailedStatus];
    } else {
      status = notificationHookConstants.invertedStatuses[notificationHookConstants.pendingStatus];
    }

    return new NotificationHookModel()
      .update({
        execution_timestamp: Math.round((Date.now() + 30 * 60 * 60) / 1000), // Retry after 30 minutes.
        retry_count: currentRetryCount + 1,
        status: status
      })
      .where({
        id: oThis.hook.id
      })
      .fire();
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

    return new NotificationHookModel().acquireLocksOnFailedHooks(oThis.lockIdentifier);
  }

  /**
   * Validate and sanitize params.
   *
   *
   * @private
   */
  _validateAndSanitize() {
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

new HookProcessor({ cronProcessId: +cronProcessId }).perform();

setInterval(function() {
  logger.info('Ending the process. Sending SIGINT.');
  process.emit('SIGINT');
}, cronProcessesConstants.continuousCronRestartInterval);
