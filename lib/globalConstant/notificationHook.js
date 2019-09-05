const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses, invertedEventTypes;

/**
 * Class for notification hook
 *
 * @class
 */
class NotificationHook {
  /**
   * Constructor for Feeds.
   *
   * @constructor
   */
  constructor() {}

  // Status kind start.

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

  get manuallyInterruptedStatus() {
    return 'MANUALLY_INTERRUPTED';
  }

  get manuallyHandledStatus() {
    return 'MANUALLY_HANDLED';
  }

  // Status kind end.

  // Event types start.

  get profileTxSendSuccessKind() {
    return 'PROFILE_TX_SEND_SUCCESS';
  }

  get profileTxReceiveSuccessKind() {
    return 'PROFILE_TX_RECEIVE_SUCCESS';
  }

  get videoTxSendSuccessKind() {
    return 'VIDEO_TX_SEND_SUCCESS';
  }

  get videoTxReceiveSuccessKind() {
    return 'VIDEO_TX_RECEIVE_SUCCESS';
  }

  get videoAddKind() {
    return 'VIDEO_ADD';
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

  get campaignEventType() {
    return 'CAMPAIGN_EVENT_TYPE';
  }

  // Event types end.

  get statuses() {
    const oThis = this;

    return {
      '1': oThis.pendingStatus,
      '2': oThis.successStatus,
      '3': oThis.failedStatus,
      '4': oThis.completelyFailedStatus,
      '5': oThis.ignoredStatus,
      '6': oThis.manuallyInterruptedStatus,
      '7': oThis.manuallyHandledStatus
    };
  }

  get invertedStatuses() {
    const oThis = this;

    if (invertedStatuses) {
      return invertedStatuses;
    }

    invertedStatuses = util.invert(oThis.statuses);

    return invertedStatuses;
  }

  get eventTypes() {
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
      '9': oThis.campaignEventType
    };
  }

  get invertedEventTypes() {
    const oThis = this;

    if (invertedEventTypes) {
      return invertedEventTypes;
    }

    invertedEventTypes = util.invert(oThis.eventTypes);

    return invertedEventTypes;
  }

  get batchSizeForHooksProcessor() {
    return 10;
  }

  get retryLimitForFailedHooks() {
    return 3;
  }

  get hookSenderBatchSize() {
    return 100;
  }

  /**
   * Is valid push notification event kind.
   *
   * @param eventType
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
    return 'messaging/serverUnavailableErrorCode';
  }

  get tokenNotRegisteredErrorCode() {
    return 'messaging/registration-token-not-registered';
  }

  get invalidPayload() {
    return 'messaging/invalid-payload';
  }

  // Error codes end.
}

module.exports = new NotificationHook();
