const rootPrefix = '../..',
  jwtHelper = require(rootPrefix + '/lib/zoom/jwtHelper');

class ZoomMeeting {
  constructor() {}

  /**
   * Create zoom meeting
   *
   * @param zoomUserId
   * @param meetingDetails
   * @param meetingsettings
   * @returns {Promise<void>}
   */
  async create(zoomUserId, meetingDetails, meetingsettings) {
    meetingsettings = meetingsettings || {};
    meetingDetails = meetingDetails || {};

    Object.assign(meetingsettings, {
      auto_recording: 'cloud'
    });

    const meeting = jwtHelper.postApi(
      "users/"+zoomUserId+"/meetings",
      {
        topic: meetingDetails.title || 'Community meet',
        type: 1, // instant meeting
        agenda: meetingDetails.agenda || '',
        settings: meetingsettings
      }
    );

    return meeting;
  }
}

module.exports = new ZoomMeeting();
