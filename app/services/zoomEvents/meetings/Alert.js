const rootPrefix = '../../../..',
  ZoomEventsForMeetingsBase = require(rootPrefix + '/app/services/zoomEvents/meetings/Base'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs');

/**
 * Class for zoom meeting alert webhook processor.
 *
 * @class MeetingAlert
 */
class MeetingAlert extends ZoomEventsForMeetingsBase {
  /**
   * Constructor
   *
   * @param {object} params
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.object = params.payload.object;

    console.log('HERE====constructor===MeetingAlert======', JSON.stringify(params));
  }

  /**
   * Async performer.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis.validateAndSetMeetingId();

    const response = responseHelper.error({
      internal_error_identifier: 's_ze_a_ap_1',
      api_error_identifier: 'something_went_wrong',
      debug_options: oThis.object
    });

    await createErrorLogsEntry.perform(response, errorLogsConstants.lowSeverity);

    return responseHelper.successWithData({});
  }
}

module.exports = MeetingAlert;
