const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses;
/**
 * Class for transaction constants.
 *
 * @class
 */
class TransactionConstants {
  /**
   * Constructor for Transaction Constants.
   *
   * @constructor
   */
  constructor() {}

  get pendingStatus() {
    return 'PENDING';
  }

  get doneStatus() {
    return 'SUBMITTED';
  }

  get failedStatus() {
    return 'MINED';
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

    if (invertedStatuses) {
      return invertedStatuses;
    }

    invertedStatuses = util.invert(oThis.statuses);

    return invertedStatuses;
  }

  get failedOstTransactionStatus() {
    return 'FAILED';
  }

  get successOstTransactionStatus() {
    return 'SUCCESS';
  }

  get notFinalizedOstTransactionStatuses() {
    return ['CREATED', 'SUBMITTED', 'MINED'];
  }
}

module.exports = new TransactionConstants();
