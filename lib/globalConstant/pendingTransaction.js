const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses;

/**
 * Class for pending transaction constants.
 *
 * @class PendingTransactionConstants
 */
class PendingTransactionConstants {
  get pendingStatus() {
    return 'PENDING';
  }

  get doneStatus() {
    return 'DONE';
  }

  get failedStatus() {
    return 'FAILED';
  }

  get statuses() {
    const oThis = this;

    return {
      '1': oThis.pendingStatus,
      '2': oThis.doneStatus,
      '3': oThis.failedStatus
    };
  }

  get invertedStatuses() {
    const oThis = this;

    invertedStatuses = invertedStatuses || util.invert(oThis.statuses);

    return invertedStatuses;
  }
}

module.exports = new PendingTransactionConstants();
