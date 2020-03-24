const rootPrefix = '../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType');

/**
 * Class for start zoom meeting payload formatter.
 *
 * @class StartZoomMeetingPayload
 */
class StartZoomMeetingPayload extends BaseFormatter {
  /**
   * Constructor for start zoom meeting payload formatter.
   *
   * @param {object} params
   * @param {object} params.startZoomMeetingPayload
   * @param {number} params.startZoomMeetingPayload.meetingId
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.startZoomMeetingPayload = params[entityTypeConstants.startZoomMeetingPayload];
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const startZoomMeetingPayloadKeyConfig = {
      meetingId: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.startZoomMeetingPayload, startZoomMeetingPayloadKeyConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {result}
   * @private
   */
  _format() {
    const oThis = this;

    return responseHelper.successWithData({
      meeting_id: oThis.startZoomMeetingPayload.meetingId
    });
  }
}

module.exports = StartZoomMeetingPayload;
