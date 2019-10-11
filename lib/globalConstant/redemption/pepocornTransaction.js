const rootPrefix = '../../..',
  util = require(rootPrefix + '/lib/util');

let invertedKinds;

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
}

module.exports = new PepocornTransaction();
