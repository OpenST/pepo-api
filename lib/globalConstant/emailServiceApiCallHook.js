const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses, invertedKinds, invertedEventKinds;

/**
 * Class for email service api call hook
 *
 * @class
 */
class EmailServiceApiCallHook {
  /**
   * Constructor for Feeds.
   *
   * @constructor
   */
  constructor() {}

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

  get sendTransactionalEmailEventKind() {
    return 'SEND_TRANSACTIONAL_MAIL';
  }

  get eventKinds() {
    const oThis = this;

    return {
      '1': oThis.sendTransactionalEmailEventKind
    };
  }

  get invertedEventKinds() {
    const oThis = this;

    if (invertedEventKinds) {
      return invertedEventKinds;
    }

    invertedEventKinds = util.invert(oThis.eventKinds);

    return invertedEventKinds;
  }

  get batchSizeForHooksProcessor() {
    return 10;
  }

  get retryLimitForFailedHooks() {
    return 3;
  }
}

module.exports = new EmailServiceApiCallHook();
