const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses, invertedEventKinds, invertedReceiverEntityKinds;

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

  // Receiver entity kinds start.

  get clientReceiverEntityKind() {
    return 'client';
  }

  // Receiver entity kinds end.

  // Event types start.

  get addContactEventType() {
    return 'ADD_CONTACT';
  }

  get updateContactEventType() {
    return 'UPDATE_CONTACT';
  }

  get sendTransactionalEmailEventType() {
    return 'SEND_TRANSACTIONAL_MAIL';
  }

  // Event types end.

  // Pepo-campaigns template names start.

  get platformDoubleOptinTemplateName() {
    return 'platform_double_optin';
  }

  // Pepo-campaigns template names end.

  // This function is used to validate template names.
  get supportedTemplatesMap() {
    const oThis = this;
    return {
      [oThis.platformDoubleOptinTemplateName]: 1
    };
  }

  // Custom attributes start.
  get firstNameAttribute() {
    return 'First Name';
  }

  get lastNameAttribute() {
    return 'Last Name';
  }
  // Custom attributes end.

  // This function is used to validate custom attributes.
  get supportedCustomAttributesMap() {
    const oThis = this;
    return {
      [oThis.firstNameAttribute]: 1,
      [oThis.lastNameAttribute]: 1
    };
  }

  get receiverEntityKinds() {
    const oThis = this;

    return {
      '1': oThis.clientReceiverEntityKind
    };
  }

  get invertedReceiverEntityKinds() {
    const oThis = this;

    if (invertedStatuses) {
      return invertedStatuses;
    }

    invertedStatuses = util.invert(oThis.statuses);

    return invertedStatuses;
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

  get eventKinds() {
    const oThis = this;

    return {
      '1': oThis.sendTransactionalEmailEventType,
      '2': oThis.addContactEventType,
      '3': oThis.updateContactEventType
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
