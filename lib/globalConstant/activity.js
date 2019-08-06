const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses, invertedEntityTypes;

/**
 * Class for Activity constants.
 *
 * @class ActivityConstants
 */
class ActivityConstants {
  get transactionEntityType() {
    return 'TRANSACTION';
  }

  get entityTypes() {
    const oThis = this;

    return {
      '1': oThis.transactionEntityType
    };
  }

  get invertedEntityTypes() {
    const oThis = this;

    if (invertedEntityTypes) {
      return invertedEntityTypes;
    }

    invertedEntityTypes = util.invert(oThis.entityTypes);

    return invertedEntityTypes;
  }

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
}

module.exports = new ActivityConstants();
