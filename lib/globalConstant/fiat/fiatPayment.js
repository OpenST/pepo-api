const rootPrefix = '../../..',
  util = require(rootPrefix + '/lib/util');

let invertedKinds, invertedStatuses, invertedServiceKinds;

/**
 * Class for fiat payment constants.
 *
 * @class FiatPaymentConstants
 */
class FiatPaymentConstants {
  get topUpKind() {
    return 'TOP_UP';
  }

  get userToUserKind() {
    return 'USER_TO_USER';
  }

  get kinds() {
    const oThis = this;

    return {
      '1': oThis.topUpKind,
      '2': oThis.userToUserKind
    };
  }

  get invertedKinds() {
    const oThis = this;

    invertedKinds = invertedKinds || util.invert(oThis.kinds);

    return invertedKinds;
  }

  get applePayKind() {
    return 'APPLE_PAY';
  }

  get googlePayKind() {
    return 'GOOGLE_PAY';
  }

  get serviceKinds() {
    const oThis = this;

    return {
      '1': oThis.applePayKind,
      '2': oThis.googlePayKind
    };
  }

  get invertedServiceKinds() {
    const oThis = this;

    invertedServiceKinds = invertedServiceKinds || util.invert(oThis.serviceKinds);

    return invertedServiceKinds;
  }

  get receiptValidationPendingStatus() {
    return 'receiptValidationPending';
  }

  get receiptValidationSuccessStatus() {
    return 'receiptValidationSuccess';
  }

  get receiptValidationFailedStatus() {
    return 'receiptValidationFailed';
  }

  get receiptValidationCancelledStatus() {
    return 'receiptValidationCancelled';
  }

  get pepoTransferSuccessStatus() {
    return 'pepoTransferSuccess';
  }

  get pepoTransferFailedStatus() {
    return 'pepoTransferFailed';
  }

  get testPaymentStatus() {
    return 'testPayment';
  }

  get statuses() {
    const oThis = this;

    return {
      '1': oThis.receiptValidationPendingStatus,
      '2': oThis.receiptValidationSuccessStatus,
      '3': oThis.receiptValidationFailedStatus,
      '4': oThis.receiptValidationCancelledStatus,
      '5': oThis.pepoTransferSuccessStatus,
      '6': oThis.pepoTransferFailedStatus,
      '7': oThis.testPaymentStatus
    };
  }

  get invertedStatuses() {
    const oThis = this;

    invertedStatuses = invertedStatuses || util.invert(oThis.statuses);

    return invertedStatuses;
  }
}

module.exports = new FiatPaymentConstants();
