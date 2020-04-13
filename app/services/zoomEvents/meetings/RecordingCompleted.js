const rootPrefix = '../../../..',
  ZoomEventsForMeetingsBase = require(rootPrefix + '/app/services/zoomEvents/meetings/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  MeetingByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/meeting/MeetingByIds'),
  SaveRecording = require(rootPrefix + '/lib/zoom/saveRecording');

/**
 * Class for zoom meeting RecordingCompleted webhook processor.
 *
 * @class RecordingCompleted
 */
class RecordingCompleted extends ZoomEventsForMeetingsBase {
  /**
   * Constructor
   *
   * @param {object} params
   *
   * @constructor
   */
  constructor(params) {
    super(params);
    const oThis = this;
    oThis.object = params.payload.object;
    console.log('HERE====constructor===RecordingCompleted======', JSON.stringify(params));
  }

  /**
   * Async performer.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis.validateAndSetMeetingId();
    if (oThis.meetingId) {
      await oThis._setZoomMeetingId();

      await new SaveRecording({
        zoomMeetingId: oThis.zoomMeetingId,
        recordingFiles: oThis.recordingFiles,
        accessToken: oThis.accessToken
      })
        .perform()
        .catch(async function(e) {
          const response = responseHelper.error({
            internal_error_identifier: 's_ze_rc_ap_1',
            api_error_identifier: 'something_went_wrong',
            debug_options: {
              event: oThis.object,
              errorObject: e
            }
          });

          await createErrorLogsEntry.perform(response, errorLogsConstants.lowSeverity);
          return Promise.reject(e);
        });
    } else {
      logger.info(`Meeting not found for zoom id ${oThis.zoomMeetingId}`);
    }

    return responseHelper.successWithData({});
  }

  /**
   * Sets zoom meeting id given a meeting id.
   *
   * @returns {Promise<Promise<never>|undefined>}
   * @private
   */
  async _setZoomMeetingId() {
    const oThis = this;
    const cacheResponse = await new MeetingByIdsCache({ ids: [oThis.meetingId] }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    let meeting = cacheResponse.data[oThis.meetingId];

    oThis.zoomMeetingId = meeting.zoomMeetingId;
  }
}

module.exports = RecordingCompleted;
