const rootPrefix = '../../..',
  util = require(rootPrefix + '/lib/util');

let invertedKinds, longToShortNamesMap;

/**
 * Class for user notification constants.
 *
 * @class UserNotificationConstants
 */
class UserNotificationConstants {
  get profileTxSendSuccessKind() {
    return 'PROFILE_TX_SEND_SUCCESS';
  }

  get profileTxReceiveSuccessKind() {
    return 'PROFILE_TX_RECEIVE_SUCCESS';
  }

  get videoTxSendSuccessKind() {
    return 'VIDEO_TX_SEND_SUCCESS';
  }

  get creditPepocornSuccessKind() {
    return 'CREDIT_PEPOCORN_SUCCESS';
  }

  get creditPepocornFailureKind() {
    return 'CREDIT_PEPOCORN_FAILURE';
  }

  get videoTxReceiveSuccessKind() {
    return 'VIDEO_TX_RECEIVE_SUCCESS';
  }

  get videoAddKind() {
    return 'VIDEO_ADD';
  }

  get userMentionKind() {
    return 'USER_MENTION';
  }

  get replyNotificationsKind() {
    return 'REPLY_NOTIFICATIONS';
  }

  get replyUserMentionKind() {
    return 'REPLY_USER_MENTION';
  }

  get youRepliedWithAmountKind() {
    return 'REPLY_SENDER_WITH_AMOUNT';
  }

  get youRepliedWithoutAmountKind() {
    return 'REPLY_SENDER_WITHOUT_AMOUNT';
  }

  get replyOnYourVideoWithAmountKind() {
    return 'REPLY_RECEIVER_WITH_AMOUNT';
  }

  get replyOnYourVideoWithoutAmountKind() {
    return 'REPLY_RECEIVER_WITHOUT_AMOUNT';
  }

  get replyThreadNotificationKind() {
    return 'REPLY_THREAD_NOTIFICATION';
  }

  get contributionThanksKind() {
    return 'CONTRIBUTION_THANKS';
  }

  get profileTxSendFailureKind() {
    return 'PROFILE_TX_SEND_FAILURE';
  }

  get videoTxSendFailureKind() {
    return 'VIDEO_TX_SEND_FAILURE';
  }

  get airdropDoneKind() {
    return 'AIRDROP_DONE';
  }

  get topupDoneKind() {
    return 'TOPUP_DONE';
  }

  get topupFailedKind() {
    return 'TOPUP_FAILED';
  }

  get recoveryInitiateKind() {
    return 'RECOVERY_INITIATE';
  }

  get systemNotificationKind() {
    return 'SYSTEM_NOTIFICATION';
  }

  get replyTxSendSuccessKind() {
    return 'REPLY_TX_SEND_SUCCESS';
  }

  get replyTxSendFailureKind() {
    return 'REPLY_TX_SEND_FAILURE';
  }

  get replyTxReceiveSuccessKind() {
    return 'REPLY_TX_RECEIVE_SUCCESS';
  }

  /**
   * Is valid notification centre event kind?
   *
   * @param {string} eventType
   *
   * @returns {boolean}
   */
  isNotificationCentreEventKind(eventType) {
    const oThis = this;

    return !!oThis.invertedKinds[eventType];
  }

  get kinds() {
    const oThis = this;

    return {
      '1': oThis.profileTxSendSuccessKind,
      '2': oThis.profileTxReceiveSuccessKind,
      '3': oThis.videoTxSendSuccessKind,
      '4': oThis.videoTxReceiveSuccessKind,
      '5': oThis.videoAddKind,
      '6': oThis.contributionThanksKind,
      '7': oThis.profileTxSendFailureKind,
      '8': oThis.videoTxSendFailureKind,
      '9': oThis.airdropDoneKind,
      '10': oThis.topupDoneKind,
      '11': oThis.topupFailedKind,
      '12': oThis.recoveryInitiateKind,
      '13': oThis.creditPepocornSuccessKind,
      '14': oThis.creditPepocornFailureKind,
      '15': oThis.userMentionKind,
      '16': oThis.youRepliedWithAmountKind,
      '17': oThis.youRepliedWithoutAmountKind,
      '18': oThis.replyOnYourVideoWithAmountKind,
      '19': oThis.replyOnYourVideoWithoutAmountKind,
      '20': oThis.replyUserMentionKind,
      '21': oThis.systemNotificationKind,
      '22': oThis.replyTxSendSuccessKind,
      '23': oThis.replyTxSendFailureKind,
      '24': oThis.replyTxReceiveSuccessKind,
      '25': oThis.replyThreadNotificationKind,
      '26': oThis.replyNotificationsKind
    };
  }

  get invertedKinds() {
    const oThis = this;

    invertedKinds = invertedKinds || util.invert(oThis.kinds);

    return invertedKinds;
  }

  get shortToLongNamesMap() {
    return {
      user_id: 'userId',
      last_action_timestamp: 'lastActionTimestamp',
      uuid: 'uuid',
      kind: 'kind',
      subject_user_id: 'subjectUserId',
      actor_ids: 'actorIds',
      actor_count: 'actorCount',
      payload: 'payload',
      heading_version: 'headingVersion',
      rdid: 'replyDetailId',
      pvid: 'parentVideoId',
      url: 'url',
      dt: 'dynamicText',
      vid: 'videoId',
      am: 'amount',
      pam: 'pepocornAmount',
      tyt: 'thankYouText',
      txid: 'transactionId',
      flag1: 'flag1',
      flag2: 'flag2',
      column1: 'column1',
      column2: 'column2'
    };
  }

  get longToShortNamesMap() {
    const oThis = this;

    longToShortNamesMap = longToShortNamesMap || util.invert(oThis.shortToLongNamesMap);

    return longToShortNamesMap;
  }

  get notificationCentreType() {
    return 'notificationCentre';
  }
}

module.exports = new UserNotificationConstants();
