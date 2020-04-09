/**
 * It picks up meetings from meetings table and using SaveRecording lib uploads the zoom meeting
 * recordings to S3.
 *
 * @module executables/oneTimers/2020_04_09_saveZoomRecording
 */

const program = require('commander');

const rootPrefix = '../..',
  Meeting = require(rootPrefix + '/app/models/mysql/meeting/Meeting'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  SaveRecording = require(rootPrefix + '/lib/zoom/SaveRecording');

// /Users/gulshanvasnani/Documents/pepo/pepo-api/lib/zoom/SaveRecording.js
// BasicHelper = require(rootPrefix + '/helpers/basic');

const BATCH_SIZE = 25;

const SAVE_ZOOM_RECORDING_BATCH_SIZE = 5;

program.on('--help', function() {
  logger.log('');
  logger.log('  Example:');
  logger.log('');
  logger.log('    node executables/oneTimers/2020_04_09_saveZoomRecording.js ');
  logger.log('');
  logger.log('');
});

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
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;
    oThis.meetingIds = [];
    // TODO: remove these 2 array
    oThis.saveCount = 0; // To be removed.
    oThis.meetingIdsForCount = []; // To be removed.
    oThis.offset = 0;
    oThis.limit = BATCH_SIZE;
    oThis.failedUploadMeetingId = [];
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    while (true) {
      await oThis._fetchMeetingIds(oThis.limit, oThis.offset);

      if (oThis.meetingIds.length === 0) {
        break;
      }

      oThis.offset = oThis.limit + oThis.offset;
      await oThis._saveRecording();
    }
    console.log('meeting ids for which upload failed : ', oThis.failedUploadMeetingId);
    console.log('all ids ', oThis.meetingIdsForCount);
  }

  /**
   * Fetch meeting ids.
   *
   * @returns {Promise<void>}
   */
  async _fetchMeetingIds(limit, offset) {
    const oThis = this;
    oThis.meetingIds.length = 0;

    const rows = await new Meeting()
      .select('zoom_meeting_id')
      .order_by('created_at asc')
      .limit(limit)
      .offset(offset)
      .fire();

    if (rows.length === 0) {
      return;
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      oThis.meetingIds.push(row.zoom_meeting_id);
    }
  }

  /**
   * Save zoom recording to S3 using SaveRecording lib.
   *
   * @returns {Promise<void>}
   */
  async _saveRecording() {
    const oThis = this;

    const saveRecordingPromises = [];

    for (let i = 0; i < oThis.meetingIds.length; i += SAVE_ZOOM_RECORDING_BATCH_SIZE) {
      for (let j = i; j < i + SAVE_ZOOM_RECORDING_BATCH_SIZE; j++) {
        oThis.saveCount += 1;
        const meetingId = oThis.meetingIds[j];
        if (!meetingId) {
          break;
        }
        oThis.meetingIdsForCount.push(meetingId);
        const saveRecording = new SaveRecording({
          zoomMeetingId: meetingId
        });
        saveRecordingPromises.push(
          saveRecording.perform().catch((error) => {
            oThis.failedUploadMeetingId.push(meetingId);
            console.log(`error from one timer while saving zoom meeting id ${meetingId} : ${error}`);
          })
        );
      }

      await Promise.all(saveRecordingPromises).catch((error) => {
        console.log(`error while saving zoom recording : ${error}`);
      });
    }
  }
}

new SaveZoomRecording({})
  .perform()
  .then(function() {
    process.exit(0);
  })
  .catch(function(err) {
    logger.error(JSON.stringify(err));
    process.exit(1);
  });
