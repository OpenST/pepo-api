const rootPrefix = '../../..',
  zoomMeetingLib = require(rootPrefix + '/lib/zoom/meeting'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  MeetingByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/meeting/MeetingByIds'),
  basicHelper = require(rootPrefix + '/helpers/basic');

/**
 * Class to end meeting on zoom
 *
 * @class EndZoomMeetingJob
 */
class EndZoomMeetingJob {
  /**
   * Constructor to end meeting on zoom.
   *
   * @param {object} params
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.meetingId = params.meetingId;

    oThis.meeting = null;
    oThis.isMeetingLive = true;
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<*>}
   */
  async perform() {
    const oThis = this;

    // Fetch meeting.
    await oThis._fetchMeeting();

    if (!oThis._shouldAllowEndMeeting()) {
      return responseHelper.successWithData({});
    }

    // Delete zoom meeting only if it is live.
    if (oThis.isMeetingLive) {
      await oThis._endMeetingOnZoom();
    }
  }

  /**
   * Checks if environment is staging and channel id is 100.
   *
   * @returns {Promise<boolean>}
   * @private
   */
  _shouldAllowEndMeeting() {
    let oThis = this;

    return basicHelper.isStaging() && oThis.meeting.channelId == 100;
  }

  /**
   * Fetch meeting details.
   *
   * @sets oThis.meetingObj
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchMeeting() {
    const oThis = this;

    const cahceRes = await new MeetingByIdsCache({ ids: [oThis.meetingId] }).fetch();

    if (cahceRes.isFailure()) {
      return Promise.reject(cahceRes);
    }

    oThis.meeting = cahceRes.data[oThis.meetingId];

    if (!CommonValidators.validateNonEmptyObject(oThis.meeting) || !oThis.meeting.isLive) {
      oThis.isMeetingLive = false;
    }
  }

  /**
   * End meeting on Zoom
   *
   * @returns {Promise<void>}
   * @private
   */
  async _endMeetingOnZoom() {
    const oThis = this;

    if ((oThis.meeting.hostJoinCount || 0) > oThis.meeting.hostLeaveCount) {
      return;
    }

    const zoomApiResponse = await zoomMeetingLib.markEnd(oThis.meeting.zoomMeetingId).catch(function() {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_j_bg_ezmj_2',
          api_error_identifier: 'zoom_call_could_not_proceed',
          debug_options: oThis.meeting
        })
      );
    });
  }
}

module.exports = EndZoomMeetingJob;
