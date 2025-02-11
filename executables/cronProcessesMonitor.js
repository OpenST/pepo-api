/**
 * This periodic cron monitors the cron processes table.
 * It selects entry from table and compares the last ending time of the entry with restart time interval
 * And sends the error notification
 *
 * Example: node executables/cronProcessesMonitor.js --cronProcessId 27
 *
 * @module executables/cronProcessesMonitor
 */

const program = require('commander');

const rootPrefix = '..',
  CronBase = require(rootPrefix + '/executables/CronBase'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  CronProcessesModel = require(rootPrefix + '/app/models/mysql/big/CronProcesses'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  cronProcessesConstants = require(rootPrefix + '/lib/globalConstant/big/cronProcesses');

program.option('--cronProcessId <cronProcessId>', 'Cron table process ID').parse(process.argv);

program.on('--help', function() {
  logger.log('');
  logger.log('  Example:');
  logger.log('');
  logger.log('    node executables/cronProcessesMonitor.js --cronProcessId 3');
  logger.log('');
  logger.log('');
});

const cronProcessId = +program.cronProcessId;

if (!cronProcessId) {
  program.help();
  process.exit(1);
}

// Declare variables.
const OFFSET_TIME_IN_MSEC = 5 * 60 * 1000;

/**
 * Class for cron processes monitor.
 *
 * @class CronProcessesMonitorExecutable
 */
class CronProcessesMonitorExecutable extends CronBase {
  /**
   * Constructor for cron processes monitor.
   *
   * @augments CronBase
   *
   * @constructor
   */
  constructor() {
    const params = { cronProcessId: cronProcessId };

    super(params);

    const oThis = this;

    oThis.canExit = true;
  }

  /**
   * Start the executable.
   *
   * @returns {Promise<any>}
   * @private
   */
  async _start() {
    const oThis = this;

    oThis.canExit = false;

    oThis.cronKindToRestartTimeMap = {
      [cronProcessesConstants.continuousCronsType]: {
        [cronProcessesConstants.emailServiceApiCallHookProcessor]: cronProcessesConstants.continuousCronRestartInterval,
        [cronProcessesConstants.pushNotificationHookProcessor]: cronProcessesConstants.continuousCronRestartInterval,
        [cronProcessesConstants.bgJobProcessor]: cronProcessesConstants.continuousCronRestartInterval,
        [cronProcessesConstants.notificationJobProcessor]: cronProcessesConstants.continuousCronRestartInterval,
        [cronProcessesConstants.webhookJobPreProcessor]: cronProcessesConstants.continuousCronRestartInterval,
        [cronProcessesConstants.pixelJobProcessor]: cronProcessesConstants.continuousCronRestartInterval,
        [cronProcessesConstants.pepoMobileEventJobProcessor]: cronProcessesConstants.continuousCronRestartInterval,
        [cronProcessesConstants.cdnCacheInvalidationProcessor]: cronProcessesConstants.continuousCronRestartInterval,
        [cronProcessesConstants.webhookProcessor]: cronProcessesConstants.continuousCronRestartInterval
      },
      // Restart interval time for periodic crons should match with devops-cron config file.
      [cronProcessesConstants.periodicCronsType]: {
        [cronProcessesConstants.pushNotificationAggregator]: 30 * 60 * 1000, // 30 mins
        [cronProcessesConstants.userSocketConnArchival]: 6 * 60 * 60 * 1000, // 6 hours
        [cronProcessesConstants.retryPendingReceiptValidation]: 10 * 60 * 1000, // 10 mins
        [cronProcessesConstants.reValidateAllReceipts]: 24 * 60 * 60 * 1000, // 24 hours
        [cronProcessesConstants.monitorOstEventHooks]: 2 * 60 * 60 * 1000, // 2 hours
        [cronProcessesConstants.populatePopularityCriteria]: 60 * 60 * 1000, // 1 hour
        [cronProcessesConstants.zoomMeetingTracker]: 15 * 60 * 1000, // 30 mins
        [cronProcessesConstants.channelTrendingRankGenerator]: 24 * 60 * 60 * 1000 //24 hours
      }
    };

    await oThis._monitor();

    oThis.canExit = true;

    return responseHelper.successWithData({});
  }

  /**
   * Monitor cron processes.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _monitor() {
    const oThis = this;

    const existingCrons = await new CronProcessesModel()
        .select('*')
        .where(['status NOT IN (?)', cronProcessesConstants.invertedStatuses[cronProcessesConstants.inactiveStatus]])
        .fire(),
      existingCronsLength = existingCrons.length;

    for (let index = 0; index < existingCronsLength; index++) {
      const cronEntity = existingCrons[index],
        cronKind = cronEntity.kind_name,
        currentTimeInMSecs = new Date().getTime(),
        lastStartedAtInMSecs = new Date(cronEntity.last_started_at).getTime(),
        lastEndedAtInMSecs = new Date(cronEntity.last_ended_at).getTime();

      logger.info(
        '*** Executing monitoring tasks for cron: [',
        cronEntity.id,
        cronKind,
        '] on machine: ',
        cronEntity.ip_address
      );
      logger.debug('currentTimeInMSecs: ', currentTimeInMSecs);
      logger.debug('lastStartedAtInMSecs: ', lastStartedAtInMSecs);
      logger.debug('lastEndedAtInMSecs: ', lastEndedAtInMSecs);

      if (
        CommonValidators.validateZeroInteger(lastEndedAtInMSecs) ||
        CommonValidators.validateZeroInteger(lastStartedAtInMSecs)
      ) {
        // For the first time devops will start all the crons by hand.
        logger.info('This cron was never started or never ended.');
        continue;
      }

      const invertedRunningStatus = cronProcessesConstants.invertedStatuses[cronProcessesConstants.runningStatus],
        invertedStoppedStatus = cronProcessesConstants.invertedStatuses[cronProcessesConstants.stoppedStatus];

      if (oThis.cronKindToRestartTimeMap[cronProcessesConstants.continuousCronsType][cronKind]) {
        const restartIntervalForCron =
          oThis.cronKindToRestartTimeMap[cronProcessesConstants.continuousCronsType][cronKind];
        logger.debug('restartIntervalForCron: ', restartIntervalForCron);

        // Check last ended time for continuous crons.
        // If last running instance ended before specified offset, notify.
        if (
          +cronEntity.status === +invertedStoppedStatus &&
          currentTimeInMSecs - lastEndedAtInMSecs > OFFSET_TIME_IN_MSEC
        ) {
          const errorIdentifierStr = `${cronKind}:cron_stopped:e_cpm_1`,
            debugOptions = {
              cronId: cronEntity.id,
              cronKind: cronKind,
              lastEndTimeFromCron: cronEntity.last_ended_at
            };
          await oThis._notifyStopState(errorIdentifierStr, debugOptions);
        }

        // Check last started time for continuous crons.
        // If currently running instance has wrong last started at time, notify [very rare case].
        if (
          +cronEntity.status === +invertedRunningStatus &&
          currentTimeInMSecs - lastStartedAtInMSecs > OFFSET_TIME_IN_MSEC + restartIntervalForCron
        ) {
          const errorIdentifierStr = `${cronKind}:cron_stuck:e_cpm_2`,
            debugOptions = {
              cronId: cronEntity.id,
              cronKind: cronKind,
              lastEndTimeFromCron: cronEntity.last_started_at
            };
          await oThis._notify(errorIdentifierStr, debugOptions);
        }
      } else if (oThis.cronKindToRestartTimeMap[cronProcessesConstants.periodicCronsType][cronKind]) {
        const restartIntervalForCron =
          oThis.cronKindToRestartTimeMap[cronProcessesConstants.periodicCronsType][cronKind];
        logger.debug('restartIntervalForCron: ', restartIntervalForCron);

        // Check last ended time for periodic crons.
        // If last running instance ended before specified offset, notify.
        if (
          +cronEntity.status === +invertedStoppedStatus &&
          currentTimeInMSecs - lastEndedAtInMSecs > OFFSET_TIME_IN_MSEC + restartIntervalForCron
        ) {
          const errorIdentifierStr = `${cronKind}:cron_stopped:e_cpm_3`,
            debugOptions = {
              cronId: cronEntity.id,
              cronKind: cronKind,
              lastEndTimeFromCron: cronEntity.last_ended_at
            };
          await oThis._notifyStopState(errorIdentifierStr, debugOptions);
        }
        // Check last started time for periodic crons.
        // If currently running instance has wrong last started at time, notify [very rare case].
        if (
          +cronEntity.status === +invertedRunningStatus &&
          currentTimeInMSecs - lastStartedAtInMSecs > OFFSET_TIME_IN_MSEC + restartIntervalForCron
        ) {
          const errorIdentifierStr = `${cronKind}:cron_stuck:e_cpm_4`,
            debugOptions = {
              cronId: cronEntity.id,
              cronKind: cronKind,
              lastEndTimeFromCron: cronEntity.last_started_at
            };
          await oThis._notify(errorIdentifierStr, debugOptions);
        }
      }
    }
  }

  /**
   * Insert entry in error_logs table.
   *
   * @param {string} errorIdentifier: errorIdentifier
   * @param {object} debugOptions:  debugOptions
   *
   * @returns {Promise<void>}
   * @private
   */
  async _notify(errorIdentifier, debugOptions) {
    const errorObject = responseHelper.error({
      internal_error_identifier: errorIdentifier,
      api_error_identifier: 'cron_stuck',
      debug_options: debugOptions
    });
    await createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);
  }

  /**
   * Insert entry in error_logs table for stop state.
   *
   * @param {string} errorIdentifier: errorIdentifier
   * @param {object} debugOptions:  debugOptions
   *
   * @returns {Promise<void>}
   * @private
   */
  async _notifyStopState(errorIdentifier, debugOptions) {
    const errorObject = responseHelper.error({
      internal_error_identifier: errorIdentifier,
      api_error_identifier: 'cron_stopped',
      debug_options: debugOptions
    });
    await createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);
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
   * Run validations on input parameters.
   *
   * @return {Promise<void>}
   * @private
   */
  async _validateAndSanitize() {
    // Do nothing.
  }

  /**
   * Get cron kind.
   *
   * @returns {string}
   *
   * @private
   */
  get _cronKind() {
    return cronProcessesConstants.cronProcessesMonitor;
  }
}

const cronProcessesMonitor = new CronProcessesMonitorExecutable({ cronProcessId: +cronProcessId });

cronProcessesMonitor
  .perform()
  .then(function() {
    logger.step('** Exiting process');
    logger.info('Cron last run at: ', Date.now());
    process.emit('SIGINT');
  })
  .catch(function(err) {
    logger.error('** Exiting process due to Error: ', err);
    process.emit('SIGINT');
  });
