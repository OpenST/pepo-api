const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses;

/**
 * Class for zoom Events.
 *
 * @class ZoomEvent
 */
class ZoomEvent {
  get pendingStatus() {
    return 'PENDING';
  }

  get startedStatus() {
    return 'STARTED';
  }

  get doneStatus() {
    return 'DONE';
  }

  get failedStatus() {
    return 'FAILED';
  }

  get statuses() {
    const oThis = this;

    return {
      '1': oThis.pendingStatus,
      '2': oThis.startedStatus,
      '3': oThis.doneStatus,
      '4': oThis.failedStatus
    };
  }

  get invertedStatuses() {
    const oThis = this;

    invertedStatuses = invertedStatuses || util.invert(oThis.statuses);

    return invertedStatuses;
  }

  // Zoom events topic start.

  get meetingStartedZoomWebhookTopic() {
    return 'meeting.started';
  }

  get meetingEndedZoomWebhookTopic() {
    return 'meeting.ended';
  }

  get meetingAlertZoomWebhookTopic() {
    return 'meeting.alert';
  }

  get meetingParticipantJoinedZoomWebhookTopic() {
    return 'meeting.participant_joined';
  }

  get meetingParticipantLeftZoomWebhookTopic() {
    return 'meeting.participant_left';
  }

  // Zoom events topic end.
}

module.exports = new ZoomEvent();
