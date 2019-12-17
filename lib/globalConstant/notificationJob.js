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

  get creditPepocornSuccess() {
    return 'un.p1.creditPepocornSuccess';
  }

  get creditPepocornFailure() {
    return 'un.p1.creditPepocornFailure';
  }

  get videoTxReceiveSuccess() {
    return 'un.p1.videoTxReceiveSuccess';
  }

  get videoAdd() {
    return 'un.p1.videoAdd';
  }

  get userMention() {
    return 'un.p1.userMention';
  }

  get replyNotificationsKind() {
    return 'un.p1.replyNotifications';
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
