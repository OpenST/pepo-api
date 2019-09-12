const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses, invertedEventKinds, invertedReceiverEntityKinds;

/**
 * Class for email service api call hook constants.
 *
 * @class EmailServiceApiCallHook
 */
class EmailServiceApiCallHook {
  // Status kinds start.
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
  // Status kinds end.

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

    invertedStatuses = invertedStatuses || util.invert(oThis.statuses);

    return invertedStatuses;
  }

  // Receiver entity kinds start.
  get preLaunchInviteEntityKind() {
    return 'PRE_LAUNCH_INVITE';
  }

  get emailDoubleOptInEntityKind() {
    return 'EMAIL_DOUBLE_OPTIN';
  }
  // Receiver entity kinds end.

  get receiverEntityKinds() {
    const oThis = this;

    return {
      '1': oThis.preLaunchInviteEntityKind,
      '2': oThis.emailDoubleOptInEntityKind
    };
  }

  get invertedReceiverEntityKinds() {
    const oThis = this;

    invertedReceiverEntityKinds = invertedReceiverEntityKinds || util.invert(oThis.receiverEntityKinds);

    return invertedReceiverEntityKinds;
  }

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

    invertedEventKinds = invertedEventKinds || util.invert(oThis.eventKinds);

    return invertedEventKinds;
  }

  // Pepo-campaigns template names start.
  get platformDoubleOptinTemplateName() {
    return 'platform_double_optin';
  }

  get pepoDoubleOptInTemplateName() {
    return 'double_opt_in_pepo';
  }

  get userReferredTemplateName() {
    return 'user_referred';
  }
  // Pepo-campaigns template names end.

  // This function is used to validate template names.
  get supportedTemplatesMap() {
    const oThis = this;

    return {
      [oThis.platformDoubleOptinTemplateName]: 1,
      [oThis.pepoDoubleOptInTemplateName]: 1,
      [oThis.userReferredTemplateName]: 1
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

  get batchSizeForHooksProcessor() {
    return 10;
  }

  get retryLimitForFailedHooks() {
    return 3;
  }
}

module.exports = new EmailServiceApiCallHook();
