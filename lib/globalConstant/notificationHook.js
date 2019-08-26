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

  get processedStatus() {
    return 'PROCESSED';
  }

  get failedStatus() {
    return 'FAILED';
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

  get individualNotificationEventType() {
    return 'INDIVIDUAL_NOTIFICATION_EVENT_TYPE';
  }

  get campaignEventType() {
    return 'CAMPAIGN_EVENT_TYPE';
  }

  // Event types end.

  get statuses() {
    const oThis = this;

    return {
      '1': oThis.pendingStatus,
      '2': oThis.processedStatus,
      '3': oThis.failedStatus,
      '4': oThis.ignoredStatus,
      '5': oThis.manuallyInterruptedStatus,
      '6': oThis.manuallyHandledStatus
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
      '1': oThis.individualNotificationEventType,
      '2': oThis.campaignEventType
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
    return 50;
  }

  get retryLimitForFailedHooks() {
    return 3;
  }

  get senderBatchSize() {
    return 100;
  }
}

module.exports = new NotificationHook();
