/**
 * It picks up meetings from meetings table and using SaveRecording lib uploads the zoom meeting
 * recordings to S3.
 *
 * @module executables/oneTimers/2020_04_09_saveZoomRecording
 */

const program = require('commander');

const rootPrefix = '../..',
  MeetingModel = require(rootPrefix + '/app/models/mysql/meeting/Meeting'),
  ZoomEvent = require(rootPrefix + '/app/models/mysql/meeting/ZoomEvent'),
  meetingConstants = require(rootPrefix + '/lib/globalConstant/meeting/meeting'),
  zoomEventConstants = require(rootPrefix + '/lib/globalConstant/zoomEvent'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  SaveRecordingLib = require(rootPrefix + '/lib/zoom/saveRecording');

const BATCH_SIZE = 25;

program.option('--relayerIds <relayerIds>', 'List of relayer ids.').parse(process.argv);

program.on('--help', function() {
  logger.log('');
  logger.log('  Example:');
  logger.log('');
  logger.log('    node executables/oneTimers/2020_04_09_saveZoomRecording.js' + ' --relayerIds "[1,2]" ');
  logger.log('');
  logger.log('');
});

if (!program.relayerIds) {
  program.help();
  process.exit(1);
}
/**
 * Class SaveZoomRecording.
 *
 * @class SaveZoomRecording
 */
class SaveZoomRecording {
  /**
   * Constructor.
   *
   * @param {object} params
   * @param {List} param.relayerIds
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.relayerIds = JSON.parse(params.relayerIds);
    oThis.failedZoomMeetingIds = [];
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis._batchPerform();

    logger.info(`Failed zoom meeting ids ${oThis.failedZoomMeetingIds}`);
  }

  async _batchPerform() {
    const oThis = this;

    let offset = 0;
    const limit = BATCH_SIZE;

    const zoomMeetingEventRows = await new ZoomEvent()
      .select('event_data')
      .where({ status: zoomEventConstants.invertedStatuses[zoomEventConstants.doneStatus] })
      .where([
        `event_data like "%${zoomEventConstants.meetingRecordingCompletedTopic}%" or event_data like "%${
          zoomEventConstants.meetingRecordingTranscriptCompletedTopic
        }%"`
      ])
      .fire();

    const zoomIdVsEvents = {};

    for (let i = 0; i < zoomMeetingEventRows.length; i++) {
      const eventData = JSON.parse(zoomMeetingEventRows[i].event_data);
      const zoomMeetingId = eventData.payload.object.id;
      if (!zoomIdVsEvents[zoomMeetingId]) {
        zoomIdVsEvents[zoomMeetingId] = [];
      }
      zoomIdVsEvents[zoomMeetingId].push(eventData);
    }

    while (true) {
      const rows = await new MeetingModel()
        .select('zoom_meeting_id')
        .where({ status: meetingConstants.invertedStatuses[meetingConstants.endedStatus] })
        .where({ meeting_relayer_id: oThis.relayerIds })
        .order_by('created_at asc')
        .limit(limit)
        .offset(offset)
        .fire();

      logger.info(`Processing ${rows.length} records`);

      for (let i = 0; i < rows.length; i++) {
        const zoomMeetingId = rows[i].zoom_meeting_id;
        const zoomEvents = zoomIdVsEvents[zoomMeetingId];
        if (!zoomEvents) {
          logger.log(`No zoom events found for zoom meeting id ${zoomMeetingId}`);
          continue;
        }
        for (let j = 0; j < zoomEvents.length; j++) {
          await oThis._saveRecording(zoomEvents[j]);
        }
      }

      if (rows.length < limit) {
        break;
      }
      offset += limit;
    }
  }

  async _saveRecording(row) {
    const oThis = this;
    const zoomMeetingId = row.payload.object.id;

    const saveRecordingObj = new SaveRecordingLib({
      zoomMeetingId: zoomMeetingId,
      recordingFiles: row.payload.object.recording_files,
      accessToken: row.download_token
    });

    return saveRecordingObj.perform().catch(function(e) {
      logger.error(`Failed to save zoom Meeting recording for zoom meeting id ${zoomMeetingId}`);
      oThis.failedZoomMeetingIds.push(zoomMeetingId);
    });
  }
}

new SaveZoomRecording({
  relayerIds: program.relayerIds
})
  .perform()
  .then(function() {
    process.exit(0);
  })
  .catch(function(err) {
    logger.error(JSON.stringify(err));
    process.exit(1);
  });
