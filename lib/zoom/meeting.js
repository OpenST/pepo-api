const crypto = require('crypto');

const rootPrefix = '../..',
  jwtHelper = require(rootPrefix + '/lib/zoom/jwtHelper'),
  zoomConstant = require(rootPrefix + '/lib/globalConstant/meeting/zoom');

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

    const meeting = jwtHelper.postApi('users/' + zoomUserId + '/meetings', {
      topic: meetingDetails.title || 'Community meet',
      type: 1, // Instant meeting.
      agenda: meetingDetails.agenda || '',
      settings: meetingsettings
    });

    return meeting;
  }

  /**
   * Delete zoom meeting
   *
   * @param meetingId
   * @returns {Promise<void>}
   */
  async delete(meetingId) {
    const response = jwtHelper.deleteApi('meetings/' + meetingId);

    return response;
  }

  /**
   * Get meeting by meeting id
   *
   * @param meetingId
   */
  getBy(meetingId) {
    const response = jwtHelper.getApi('meetings/' + meetingId);

    return response;
  }

  /**
   * Mark ended
   *
   * @param meetingId
   */
  markEnd(meetingId) {
    const response = jwtHelper.putApi('meetings/' + meetingId + '/status', { action: 'end' });

    return response;
  }

  /**
   * Get past meeting details.
   *
   * @param uuid
   */
  getPastMeeting(uuid) {
    const response = jwtHelper.getApi('past_meetings/' + uuid);
    return response;
  }
  /**
   * Get signature
   *
   * @param meetingNumber
   * @param to_start - send this true for starting the meeting
   */
  getSignature(meetingNumber, to_start) {
    const timestamp = new Date().getTime() - 30000;

    // send role = 0 to join meeting or 1 to start meeting
    const role = to_start ? 1 : 0;

    const msg = Buffer.from(zoomConstant.apiKey + meetingNumber + timestamp + role).toString('base64');
    const hash = crypto
      .createHmac('sha256', zoomConstant.apiSecret)
      .update(msg)
      .digest('base64');
    const signature = Buffer.from(`${zoomConstant.apiKey}.${meetingNumber}.${timestamp}.${role}.${hash}`).toString(
      'base64'
    );

    return signature;
  }

  getRecording(meetingId) {
    const response = jwtHelper.getApi(`/meetings/${meetingId}/recordings/`);
    return response;
  }

  deleteRecording(meetingId) {
    const action = {
      action: 'delete'
    };
    const response = jwtHelper.deleteApi(`/meetings/${meetingId}/recordings/`, action);
    return response;
  }

  deleteRecordingFile(meetingId, recordingId) {
    const action = {
      action: 'delete'
    };

    const response = jwtHelper.deleteApi(`/meetings/${meetingId}/recordings/${recordingId}`, action);
    return response;
  }
}

module.exports = new ZoomMeeting();
