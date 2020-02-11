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

  get replyTxSendFailure() {
    return 'un.p1.replyTxSendFailure';
  }

  get profileTxReceiveSuccess() {
    return 'un.p1.profileTxReceiveSuccess';
  }

  get videoTxSendSuccess() {
    return 'un.p1.videoTxSendSuccess';
  }

  get replyTxSendSuccess() {
    return 'un.p1.replyTxSendSuccess';
  }

  get creditPepocornSuccess() {
    return 'un.p1.creditPepocornSuccess';
  }

  get creditPepocornFailure() {
    return 'un.p1.creditPepocornFailure';
  }

  get videoTxReceiveSuccess() {
    return 'un.p1.videoTxReceiveSuccess';
  }

  get replyTxReceiveSuccess() {
    return 'un.p1.replyTxReceiveSuccess';
  }

  get replyNotificationsKind() {
    return 'un.p1.replyNotifications';
  }

  get videoNotificationsKind() {
    return 'un.p1.videoNotifications';
  }

  get contributionThanks() {
    return 'un.p1.contributionThanks';
  }

  get airdropDone() {
    return 'un.p1.airdropDone';
  }

  get topupDone() {
    return 'un.p1.topupDone';
  }

  get topupFailed() {
    return 'un.p1.topupFailed';
  }

  get recoveryInitiate() {
    return 'un.p1.recoveryInitiate';
  }

  get paperPlaneTransaction() {
    return 'un.p1.paperPlaneTransaction';
  }

  get systemNotification() {
    return 'un.p1.systemNotification';
  }
  // Topics end.
}

module.exports = new NotificationJob();
