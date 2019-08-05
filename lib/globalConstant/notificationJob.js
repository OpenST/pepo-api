/**
 * Class for Notification job constants.
 *
 * @class notificationJob
 */
class NotificationJob {
  // Topics / topics start

  get profileTxSendSuccess() {
    return 'un.p1.profileTxSendSuccess';
  }

  get profileTxReceiveSuccess() {
    return 'un.p1.profileTxReceiveSuccess';
  }

  get videoTxSendSuccess() {
    return 'un.p1.videoTxSendSuccess';
  }

  get videoTxReceiveSuccess() {
    return 'un.p1.videoTxReceiveSuccess';
  }

  get videoAdd() {
    return 'un.p1.videoAdd';
  }

  get contributionThanks() {
    return 'un.p1.contributionThanks';
  }
}

module.exports = new NotificationJob();
