/**
 * It picks up meetings from meetings table and using SaveRecording lib uploads the zoom meeting
 * recordings to S3.
 *
 * @module executables/oneTimers/2020_04_09_saveZoomRecording
 */

const program = require('commander');

const rootPrefix = '../..',
  MeetingModel = require(rootPrefix + '/app/models/mysql/meeting/Meeting'),
  meetingConstants = require(rootPrefix + '/lib/globalConstant/meeting/meeting'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  SaveRecordingLib = require(rootPrefix + '/lib/zoom/SaveRecording');

const BATCH_SIZE = 25;

program.option('--relayerIds <relayerIds>', 'List of relayer ids.').parse(process.argv);

program.on('--help', function() {
  logger.log('');
  logger.log('  Example:');
  logger.log('');
  logger.log('    node executables/oneTimers/2020_04_09_saveZoomRecording.js' + ' --relayerId "[1,2]" ');
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
        await oThis._saveRecording(rows[i].zoom_meeting_id);
      }

      if (rows.length < limit) {
        break;
      }
      offset += limit;
    }
  }

  async _saveRecording(zoomMeetingId) {
    const oThis = this;

    const saveRecordingObj = new SaveRecordingLib({
      zoomMeetingId: zoomMeetingId
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
