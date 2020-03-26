const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for meeting single formatter.
 *
 * @class MeetingSingleFormatter
 */
class MeetingSingleFormatter extends BaseFormatter {
  /**
   * Constructor for meeting single formatter.
   *
   * @param {object} params
   * @param {object} params.meeting
   *
   * @param {number} params.meeting.id
   * @param {number} params.meeting.hostUserId
   * @param {number} params.meeting.channelId
   * @param {number} params.meeting.updatedAt
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.meeting = params.meeting;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const meetingKeyConfig = {
      id: { isNullAllowed: false },
      hostUserId: { isNullAllowed: false },
      channelId: { isNullAllowed: false },
      updatedAt: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.meeting, meetingKeyConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {*|result}
   * @private
   */
  _format() {
    const oThis = this;

    return responseHelper.successWithData({
      id: Number(oThis.meeting.zoomMeetingId),
      host_user_id: Number(oThis.meeting.hostUserId),
      channel_id: Number(oThis.meeting.channelId),
      uts: Number(oThis.meeting.updatedAt)
    });
  }
}

module.exports = MeetingSingleFormatter;
