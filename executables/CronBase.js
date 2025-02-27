const rootPrefix = '..',
  CronProcessHandler = require(rootPrefix + '/lib/CronProcessesHandler'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  sigIntConst = require(rootPrefix + '/lib/globalConstant/sigInt'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs');

// Declare variables.
const cronProcessHandlerObject = new CronProcessHandler();

/**
 * Class for sigint handler.
 *
 * This class has 2 responsibilities
 * 1. sigint handling
 * 2. cron processes table queries and validations
 *
 * @class CronBase
 */
class CronBase {
  /**
   * Constructor for sigint handler.
   *
   * @param {object} params
   * @param {number} params.cronProcessId
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.cronProcessId = params.cronProcessId;

    oThis.cronStarted = false;
    oThis.stopPickingUpNewWork = false;

    oThis.attachHandlers(); // Attaching handlers from sigint handler.
  }

  /**
   * Main performer method for the class.
   *
   * @returns {Promise<>}
   */
  perform() {
    const oThis = this;

    return oThis.asyncPerform().catch(async function(err) {
      oThis.canExit = true;

      logger.log('Marked can exit as true in cron Base catch block.');

      // If asyncPerform fails, run the below catch block.
      logger.error('Error in executables/CronBase.js: ', err);

      let errorObject = err;

      if (!responseHelper.isCustomResult(err)) {
        errorObject = responseHelper.error({
          internal_error_identifier: 'unhandled_catch_response:e_cb_1',
          api_error_identifier: 'unhandled_catch_response',
          debug_options: {
            cronProcessId: oThis.cronProcessId,
            cronName: oThis._cronKind,
            error: err.toString(),
            stack: err.stack
          }
        });
      }

      // Severity is same for all the cron errors. Check if there is a way specific to the error.
      await createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);

      process.emit('SIGINT');
    });
  }

  /**
   * Async performer.
   *
   * @returns {Promise<void>}
   */
  async asyncPerform() {
    const oThis = this;

    await oThis._validateCronProcess();

    await oThis._validateAndSanitize();

    await oThis._start();
  }

  /**
   * Attach SIGINT/SIGTERM handlers to the current process.
   */
  attachHandlers() {
    const oThis = this;

    let notifierCalled = false;

    /**
     * Send error notification function.
     * If cron doesn't stop after 60 secs of receiving SIGINT, send error notification.
     */
    const sendNotification = async function() {
      const errorObject = responseHelper.error({
        internal_error_identifier: `${oThis._cronKind}:cron_stuck:e_cb_3`,
        api_error_identifier: 'cron_stuck',
        debug_options: {
          cronProcessId: oThis.cronProcessId,
          cronName: oThis._cronKind
        }
      });
      await createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);
    };

    /**
     * Handler for SIGINT and SIGTERM signals.
     */
    const handle = async function() {
      if (!oThis.cronStarted) {
        logger.error('Exit Cron as it did not start the process');
        process.exit(1);
      }
      sigIntConst.setSigIntStatus;
      // Rachin: Does this need to be called more than once?
      oThis._stopPickingUpNewTasks();

      // Sleep to give some breathing space to cancel consume. So by chance if during cancellation new message arrives, it got considered
      await basicHelper.sleep(5000);

      // We need to call notifier only once.
      if (!notifierCalled) {
        setTimeout(sendNotification, 60000);
        notifierCalled = true;
      }

      if (oThis._pendingTasksDone()) {
        logger.info(':: No pending tasks. Changing the status ');

        cronProcessHandlerObject
          .stopProcess(oThis.cronProcessId)
          .then(function() {
            logger.info('Status and last_ended_at updated in table. Killing process.');

            // Stop the process only after the entry has been updated in the table.
            process.exit(0);
          })
          .catch(function(err) {
            logger.error(`Error occurred while stopping cron. Error: ${err}`);
            process.exit(1);
          });
      } else {
        logger.info(':: There are pending tasks. Waiting for completion.');
        // Rachin: Consider breaking this function into 2 parts:
        // A. One that is signal handler which:
        //    1. _stopPickingUpNewTasks
        //    2. schedules sendNotification
        // B. The other that is a recursive method which verifies _pendingTasksDone.
        setTimeout(handle, 1000);
      }
    };

    process.on('SIGINT', handle);
    process.on('SIGTERM', handle);
  }

  /**
   * Stops consumption upon invocation
   */
  _stopPickingUpNewTasks() {
    const oThis = this;

    logger.info(':: _stopPickingUpNewTasks called');

    oThis.stopPickingUpNewWork = true;
  }

  /**
   * Validate cron process.
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _validateCronProcess() {
    const oThis = this;

    const response = await cronProcessHandlerObject.canStartProcess({
      id: oThis.cronProcessId, // Implicit string to int conversion.
      cronKind: oThis._cronKind
    });

    if (response.isSuccess()) {
      oThis.cronStarted = true;
    }

    try {
      // Fetch params from the DB.
      const cronParams = JSON.parse(response.data.params);

      // All the cron process params will be available in oThis object as attributes.
      for (const key in cronParams) {
        oThis[key] = cronParams[key];
      }
    } catch (err) {
      logger.error('cron process params stored in INVALID format in the DB.');
      logger.error(
        'The status of the cron was NOT changed to stopped. Please check the status before restarting the cron'
      );
      logger.error('Error: ', err);
      process.exit(1);
    }
  }

  /**
   * Validate and sanitize.
   *
   * @private
   */
  _validateAndSanitize() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Start cron process
   *
   * @private
   */
  async _start() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * This function provides info whether the process has to exit.
   *
   * @private
   */
  _pendingTasksDone() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Cron kind
   *
   * @private
   */
  get _cronKind() {
    throw new Error('Sub-class to implement.');
  }
}

module.exports = CronBase;
