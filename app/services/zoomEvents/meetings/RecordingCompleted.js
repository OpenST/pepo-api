const rootPrefix = '../../../..',
  ZoomEventsForMeetingsBase = require(rootPrefix + '/app/services/zoomEvents/meetings/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
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

    await new SaveRecording({ zoomMeetingId: oThis.zoomMeetingId }).perform().catch(async (e) => {
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

    return responseHelper.successWithData({});
  }
}

module.exports = RecordingCompleted;
