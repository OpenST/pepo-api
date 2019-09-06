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

  get airdropDone() {
    return 'un.p1.airdropDone';
  }

  get recoveryInitiate() {
    return 'un.p1.recoveryInitiate';
  }

  get paperPlaneTransaction() {
    return 'un.p1.paperPlaneTransaction';
  }
  // Topics end.
}

module.exports = new NotificationJob();
