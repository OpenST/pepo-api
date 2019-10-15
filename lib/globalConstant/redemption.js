const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses;

class RedemptionConstant {
  get activeStatus() {
    return 'ACTIVE';
  }

  get inactiveStatus() {
    return 'INACTIVE';
  }

  get statuses() {
    const oThis = this;

    return {
      '1': oThis.activeStatus,
      '2': oThis.inactiveStatus
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

  get pepocornPerDollarStep() {
    return 1;
  }
}

module.exports = new RedemptionConstant();
