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
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  MeetingEnded = require(rootPrefix + '/app/services/zoomEvents/meetings/Ended');

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

const BATCH_SIZE = 10;
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

    await oThis._performBatch();

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

    let offset = 0;
    while (true) {
      const meetings = await new MeetingModel()
        .select('*')
        .where({ is_live: meetingConstants.isLiveStatus })
        .where(['start_timestamp IS NULL'])
        .where(['created_at < ?', basicHelper.getCurrentTimestampInSeconds() - WAIT_TIME])
        .limit(BATCH_SIZE)
        .offset(offset)
        .order_by('created_at ASC')
        .fire();

      logger.info(`Processing ${meetings.length} records`);

      for (let index = 0; index < meetings.length; index += 1) {
        const formattedRow = new MeetingModel().formatDbData(meetings[index]);

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

        const { isWaiting, isEnded } = await oThis._getZoomMeetingStatus(
          formattedRow.zoomMeetingId,
          formattedRow.zoomUUID
        );

        // meeting ended records are considered as processed.
        let isProcessed = isEnded;

        // This sleep is added to ensure that rate limit of zoom api calls is not exceeded.
        // NOTE - Zoom API rate limit is 10 requests/second.
        await basicHelper.sleep(250);

        if (isWaiting) {
          await oThis._deleteZoomMeeting(formattedRow.zoomMeetingId);
          await oThis._markMeetingAsNotAliveAndDeleted(formattedRow.id, formattedRow.channelId);
          await oThis._markRelayerAvailable(formattedRow.meetingRelayerId);
          isProcessed = true;
        }

        if (!isProcessed) {
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
   * Checks if zoom meeting is in waiting state. Otherwise it also tries to end
   * meeting.
   *
   * @param zoomMeetingId
   * @param zoomUUID
   * @returns {Promise<{isWaiting: boolean, isEnded: boolean}>}
   * @private
   */
  async _getZoomMeetingStatus(zoomMeetingId, zoomUUID) {
    let oThis = this;
    let isError = false;
    let isEnded = false;

    logger.info(`Getting zoom meeting id :${zoomMeetingId}`);
    const response = await MeetingLib.getBy(zoomMeetingId).catch(async (e) => {
      if (e.statusCode === 404) {
        logger.info(`Meeting not found or expired zoom meeting id ${zoomMeetingId}`);
        await oThis._endMeeting(zoomMeetingId, zoomUUID);
        isEnded = true;
        logger.info('Meeting ended successfully');
      }
      isError = true;
    });

    if (isError) {
      return { isWaiting: false, isEnded: isEnded };
    }
    logger.info(`Zoom meeting status for id ${zoomMeetingId} is ${response.status}`);
    return { isWaiting: response.status === 'waiting', isEnded: isEnded };
  }

  /**
   * Checks if meeting is live and not started then delete the zoom meeting
   *
   * @param zoomMeetingId Zoom meeting Id
   * @returns {Promise<void>}
   * @private
   */
  async _deleteZoomMeeting(zoomMeetingId) {
    let isError = false;
    logger.info(`Deleting zoom meeting: ${zoomMeetingId}`);
    await MeetingLib.delete(zoomMeetingId).catch((e) => {
      isError = true;
      logger.error(`Error in deleting zoom meeting, zoom id ${zoomMeetingId} Error ${e}`);
    });

    if (!isError) {
      logger.info(`Meeting deleted: ${zoomMeetingId}`);
    }
  }

  /**
   * This method ends the meeting.
   * @param zoomMeetingId Zoom meeting id.
   * @param zoomUUID Zoom meeting uuid.
   * @private
   */
  async _endMeeting(zoomMeetingId, zoomUUID) {
    let isError = false;
    logger.info(`Ending meeting zoom meeting id ${zoomMeetingId}`);
    logger.info(`Fetching past meeting details for uuid ${zoomUUID}`);

    const pastMeetingResponse = await MeetingLib.getPastMeeting(zoomUUID).catch(async (e) => {
      isError = true;
      logger.error(`Error in fetching past meeting details for UUID ${zoomUUID} error status ${e.statusCode}`);
      const errorObject = responseHelper.error({
        internal_error_identifier: 'e_z_m_t_2',
        api_error_identifier: 'something_went_wrong',
        debug_options: { zoomMeetingId: zoomMeetingId }
      });
      await createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);
    });
    if (!isError) {
      const response = await new MeetingEnded({
        payload: {
          object: {
            id: zoomMeetingId,
            start_time: pastMeetingResponse.start_time,
            end_time: pastMeetingResponse.end_time
          }
        }
      }).perform();

      if (response.isFailure()) {
        logger.error(`Error in ending meeting zoom meeting id ${zoomMeetingId}`);
        const errorObject = responseHelper.error({
          internal_error_identifier: 'e_z_m_t_3',
          api_error_identifier: 'something_went_wrong',
          debug_options: { zoomMeetingId: zoomMeetingId }
        });
        await createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);
      }
    }
  }

  /**
   * Mark meeting as not alive and deleted in the meeting table and flushes the
   * cache.
   *
   * @param meetingId Primary key of meeting table.
   * @param channelId Channel Identifier.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _markMeetingAsNotAliveAndDeleted(meetingId, channelId) {
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
        internal_error_identifier: 'e_z_m_t_4',
        api_error_identifier: 'something_went_wrong',
        debug_options: { meetingId: meetingId }
      });
      await createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);
      return;
    }

    await MeetingModel.flushCache({ id: meetingId, channelId: channelId });
  }

  /**
   * Roll back meeting and flushes the cache.
   *
   * @param meetingRelayerid meeting relayer id.
   * @returns {Promise<void>}
   * @private
   */
  async _markRelayerAvailable(meetingRelayerid) {
    logger.info(`Marking relayer as available ID: ${meetingRelayerid}`);

    await new MeetingRelayerModel()
      .update({
        status: meetingRelayerConstants.invertedStatuses[meetingRelayerConstants.availableStatus]
      })
      .where({ id: meetingRelayerid })
      .where({ status: meetingRelayerConstants.invertedStatuses[meetingRelayerConstants.reservedStatus] })
      .fire();

    await MeetingRelayerModel.flushCache({ id: meetingRelayerid });
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
