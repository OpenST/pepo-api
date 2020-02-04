const rootPrefix = '../../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses, invertedEventTypes;

/**
 * Class for notification hook constants.
 *
 * @class NotificationHook
 */
class NotificationHook {
  // Statuses start.
  get pendingStatus() {
    return 'PENDING';
  }

  get successStatus() {
    return 'SUCCESS';
  }

  get failedStatus() {
    return 'FAILED';
  }

  get completelyFailedStatus() {
    return 'COMPLETELY_FAILED';
  }

  get ignoredStatus() {
    return 'IGNORED';
  }
  // Statuses end.

  get statuses() {
    const oThis = this;

    return {
      '1': oThis.pendingStatus,
      '2': oThis.successStatus,
      '3': oThis.failedStatus,
      '4': oThis.completelyFailedStatus
    };
  }

  get invertedStatuses() {
    const oThis = this;

    invertedStatuses = invertedStatuses || util.invert(oThis.statuses);

    return invertedStatuses;
  }

  // Event types start.
  get contributionThanksKind() {
    return 'CONTRIBUTION_THANKS';
  }

  get paperPlaneTransactionKind() {
    return 'PAPER_PLANE_TRANSACTION';
  }

  get aggregatedTxReceiveSuccessKind() {
    return 'AGGREGATED_RECEIVE_SUCCESS';
  }

  get recoveryInitiateKind() {
    return 'RECOVERY_INITIATE';
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

  get replyOnYourVideoWithAmountKind() {
    return 'REPLY_RECEIVER_WITH_AMOUNT';
  }

  get replyOnYourVideoWithoutAmountKind() {
    return 'REPLY_RECEIVER_WITHOUT_AMOUNT';
  }

  get replyThreadNotificationKind() {
    return 'REPLY_THREAD_NOTIFICATION';
  }

  get systemNotificationKind() {
    return 'SYSTEM_NOTIFICATION';
  }

  get videoAddInChannelKind() {
    return 'VIDEO_ADD_CHANNEL';
  }
  // Event types end.

  get eventTypes() {
    const oThis = this;

    return {
      '3': oThis.contributionThanksKind,
      '4': oThis.aggregatedTxReceiveSuccessKind,
      '6': oThis.paperPlaneTransactionKind,
      '7': oThis.recoveryInitiateKind,
      '8': oThis.userMentionKind,
      '9': oThis.replyOnYourVideoWithAmountKind,
      '10': oThis.replyOnYourVideoWithoutAmountKind,
      '11': oThis.replyUserMentionKind,
      '12': oThis.systemNotificationKind,
      '13': oThis.replyThreadNotificationKind,
      '14': oThis.replyNotificationsKind,
      '15': oThis.videoAddInChannelKind
    };
  }

  get invertedEventTypes() {
    const oThis = this;

    invertedEventTypes = invertedEventTypes || util.invert(oThis.eventTypes);

    return invertedEventTypes;
  }

  get batchSizeForHooksProcessor() {
    return 10;
  }

  get retryLimitForFailedHooks() {
    return 5;
  }

  get hookSenderBatchSize() {
    return 100;
  }

  /**
   * Is valid push notification event kind.
   *
   * @param {string} eventType
   *
   * @returns {boolean}
   */
  isPushNotificationEventType(eventType) {
    const oThis = this;

    return !!oThis.invertedEventTypes[eventType];
  }

  // Error codes start.
  get invalidArgumentErrorCode() {
    return 'messaging/invalid-argument';
  }

  get unregisteredErrorCode() {
    return 'messaging/unregistered';
  }

  get thirdPartyAuthErrorCode() {
    return 'messaging/third_party_auth_error';
  }

  get serverUnavailableErrorCode() {
    return 'messaging/server-unavailable';
  }

  get tokenNotRegisteredErrorCode() {
    return 'messaging/registration-token-not-registered';
  }

  get invalidPayload() {
    return 'messaging/invalid-payload';
  }
  // Error codes end.

  get pushNotificationType() {
    return 'pushNotification';
  }
}

module.exports = new NotificationHook();
