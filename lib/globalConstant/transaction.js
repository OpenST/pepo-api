const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses;
/**
 * Class for transaction constants.
 *
 * @class TransactionConstants
 */
class TransactionConstants {
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

  get extraData() {
    return {
      airdropKind: 'AIRDROP',
      userTransactionKind: 'USER_TRANSACTION'
    };
  }
}

module.exports = new TransactionConstants();
