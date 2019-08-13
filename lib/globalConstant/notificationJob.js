/**
 * Class for notification job constants.
 *
 * @class NotificationJob
 */
class NotificationJob {
  // Topics start.
  get profileTxSendSuccess() {
    return 'un.p1.profileTxSendSuccess';
  }

  get profileTxSendFailure() {
    return 'un.p1.profileTxSendFailure';
  }

  get videoTxSendFailure() {
    return 'un.p1.videoTxSendFailure';
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
  // Topics end.
}

module.exports = new NotificationJob();
