const rootPrefix = '../../..',
  util = require(rootPrefix + '/lib/util');

let invertedKinds, invertedStatuses;

class PepocornTransaction {
  get creditKind() {
    return 'CREDIT';
  }

  get debitKind() {
    return 'DEBIT';
  }

  get refundCreditKind() {
    return 'REFUND_CREDIT';
  }

  get kinds() {
    const oThis = this;

    return {
      '1': oThis.creditKind,
      '2': oThis.debitKind,
      '3': oThis.refundCreditKind
    };
  }

  get invertedKinds() {
    const oThis = this;

    invertedKinds = invertedKinds || util.invert(oThis.kinds);

    return invertedKinds;
  }

  // Status Start

  get processingStatus() {
    return 'PROCESSING';
  }

  get processedStatus() {
    return 'PROCESSED';
  }

  get failedStatus() {
    return 'FAILED';
  }

  get completelyFailedStatus() {
    return 'COMPLETELY_FAILED';
  }

  get statuses() {
    const oThis = this;

    return {
      '1': oThis.processingStatus,
      '2': oThis.processedStatus,
      '3': oThis.failedStatus,
      '4': oThis.completelyFailedStatus
    };
  }

  get invertedStatuses() {
    const oThis = this;

    invertedStatuses = invertedStatuses || util.invert(oThis.statuses);

    return invertedStatuses;
  }
}

module.exports = new PepocornTransaction();
