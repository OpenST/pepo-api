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

  get replyUserMention() {
    return 'un.p1.replyUserMention';
  }

  get replySenderWithAmount() {
    return 'un.p1.replySenderWithAmount';
  }

  get replySenderWithoutAmount() {
    return 'un.p1.replySenderWithoutAmount';
  }

  get replyReceiverWithAmount() {
    return 'un.p1.replyReceiverWithAmount';
  }

  get replyReceiverWithoutAmount() {
    return 'un.p1.replyReceiverWithoutAmount';
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
  // Topics end.
}

module.exports = new NotificationJob();
