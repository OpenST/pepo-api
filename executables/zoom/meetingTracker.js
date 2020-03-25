const program = require('commander');

const rootPrefix = '../../',
  CronBase = require(rootPrefix + '/executables/CronBase'),
  cronProcessesConstants = require(rootPrefix + '/lib/globalConstant/big/cronProcesses'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  MeetingModel = require(rootPrefix + '/app/models/mysql/meeting/Meeting'),
  MeetingRelayerModel = require(rootPrefix + '/app/models/mysql/meeting/MeetingRelayer'),
  MeetingLib = require(rootPrefix + '/lib/zoom/meeting'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  meetingRelayerConstants = require(rootPrefix + '/lib/globalConstant/meeting/meetingRelayer'),
  meetingConstants = require(rootPrefix + '/lib/globalConstant/meeting/meeting'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

program.option('--cronProcessId <cronProcessId>', 'Cron table process ID').parse(process.argv);

program.on('--help', function() {
  logger.log('');
  logger.log('  Example:');
  logger.log('');
  logger.log('    node executables/zoom/meetingTracker.js' + ' --cronProcessId 50');
  logger.log('');
  logger.log('');
});

const cronProcessId = +program.cronProcessId;

if (!cronProcessId) {
  program.help();
  process.exit(1);
}

const BATCH_SIZE = 25;
const WAIT_TIME = 10 * 60; // 10 mins

class MeetingTracker extends CronBase {
  constructor(params) {
    super(params);
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

  async _start() {
    const oThis = this;

    oThis.canExit = false;

    await this._performBatch();

    oThis.canExit = true;
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
   * Perform batch.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _performBatch() {
    const oThis = this;

    const meetingModel = new MeetingModel();

    let offset = 0;
    while (true) {
      const meetings = await meetingModel
        .select('*')
        .where({ is_live: 1 })
        .where(['start_timestamp IS NULL'])
        .where(['created_at < ?', basicHelper.getCurrentTimestampInSeconds() - WAIT_TIME])
        .limit(BATCH_SIZE)
        .offset(offset)
        .order_by('created_at ASC')
        .fire();

      logger.info(`Processing ${meetings.length} records`);

      for (let index = 0; index < meetings.length; index += 1) {
        const formattedRow = meetingModel.formatDbData(meetings[index]);

        // Check for data consistency
        if (formattedRow.status !== meetingConstants.waitingStatus) {
          logger.error(
            `For meeting id ${formattedRow.id}, start time stamp is null ` +
              `but meeting status is not ${meetingConstants.waitingStatus}`
          );

          const errorObject = responseHelper.error({
            internal_error_identifier: 'e_z_m_t_1',
            api_error_identifier: 'something_went_wrong',
            debug_options: { meeting: formattedRow }
          });
          await createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);

          // Skip erroneous record for the next iteration.
          offset += 1;
          continue;
        }
        const isWaiting = await oThis._isZoomMeetingStatusWaiting(formattedRow.zoomMeetingId);

        if (isWaiting) {
          await oThis._deleteZoomMeeting(formattedRow.zoomMeetingId);
          await oThis._markMeetingAsNotAlive(formattedRow.id);
          await oThis._markRelayerAvailable(formattedRow.meetingRelayerId);
        } else {
          // skip the non processed record for next iteration.
          offset += 1;
        }
      }

      if (meetings.length < BATCH_SIZE) {
        logger.info('All records processed, Quiting job');
        break;
      }
    }
  }

  /**
   * Checks if zoom meeting is in waiting state.
   * @param zoomMeetingId Meeting id;
   * @returns {Promise<boolean>}
   * @private
   */
  async _isZoomMeetingStatusWaiting(zoomMeetingId) {
    logger.info(`Getting zoom meeting id :${zoomMeetingId}`);
    const response = await MeetingLib.getBy(zoomMeetingId);
    logger.info(`Zoom meeting status for id ${zoomMeetingId} is ${response.status}`);
    return response.status === 'waiting';
  }

  /**
   * Checks if meeting is live and not started then delete the zoom meeting
   *
   * @param zoomMeetingId Zoom meeting Id
   * @returns {Promise<void>}
   * @private
   */
  async _deleteZoomMeeting(zoomMeetingId) {
    logger.info(`Deleting zoom meeting: ${zoomMeetingId}`);
    await MeetingLib.delete(zoomMeetingId);
    logger.info(`Meeting deleted: ${zoomMeetingId}`);
  }

  /**
   * Mark meeting as not alive in the meeting table
   * @param meetingId Primary key of meeting table.
   * @returns {Promise<void>}
   * @private
   */
  async _markMeetingAsNotAlive(meetingId) {
    logger.info(`Marking meeting as not alive for id: ${meetingId}`);
    const updateResponse = await new MeetingModel()
      .update({
        is_live: null,
        status: meetingConstants.invertedStatuses[meetingConstants.deletedStatus]
      })
      .where({
        id: meetingId
      })
      .fire();

    if (updateResponse.affectedRows !== 1) {
      logger.error(`Error in marking not alive status for meeting ${meetingId}`);
      const errorObject = responseHelper.error({
        internal_error_identifier: 'e_z_m_t_2',
        api_error_identifier: 'something_went_wrong',
        debug_options: { meetingId: meetingId }
      });
      await createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);
    }
  }

  /**
   * Roll back meeting.
   *
   * @param meetingRelayerid meeting relayer id.
   * @returns {Promise<void>}
   * @private
   */
  async _markRelayerAvailable(meetingRelayerid) {
    logger.info(`Marking relayer as available ID: ${meetingRelayerid}`);

    const updateResponse = await new MeetingRelayerModel()
      .update({
        status: meetingRelayerConstants.invertedStatuses[meetingRelayerConstants.availableStatus]
      })
      .where({ id: meetingRelayerid })
      .fire();

    if (updateResponse.affectedRows !== 1) {
      logger.error(`Error in updating meeting relayer status to available' +
        ' relayer id ${meetingRelayerid} `);

      const errorObject = responseHelper.error({
        internal_error_identifier: 'e_z_m_t_3',
        api_error_identifier: 'something_went_wrong',
        debug_options: { meetingRelayerid: meetingRelayerid }
      });
      await createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);
    }
  }

  /**
   * Get cron kind.
   *
   * @returns {string}
   * @private
   */
  get _cronKind() {
    return cronProcessesConstants.zoomMeetingTracker;
  }
}

const meetingTracker = new MeetingTracker({
  cronProcessId: cronProcessId
});

meetingTracker
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
