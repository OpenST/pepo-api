const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

// Declare constants.
let kinds, invertedKinds, statuses, invertedStatuses;

/**
 * Class for config strategy constants.
 *
 * @class ConfigStrategy
 */
class ConfigStrategy {
  // Config strategy kinds start.
  get globalRabbitmq() {
    return 'globalRabbitmq';
  }
  // Config strategy kinds end.

  // Config strategy statuses start.
  get activeStatus() {
    return 'active';
  }

  get inActiveStatus() {
    return 'inactive';
  }
  // Config strategy statuses end.

  get kinds() {
    const oThis = this;

    if (kinds) {
      return kinds;
    }

    kinds = {
      '1': oThis.globalRabbitmq
    };

    return kinds;
  }

  get invertedKinds() {
    const oThis = this;

    if (invertedKinds) {
      return invertedKinds;
    }

    invertedKinds = util.invert(oThis.kinds);

    return invertedKinds;
  }

  get statuses() {
    const oThis = this;

    if (statuses) {
      return statuses;
    }

    statuses = {
      '1': oThis.activeStatus,
      '2': oThis.inActiveStatus
    };

    return statuses;
  }

  get invertedStatuses() {
    const oThis = this;

    if (invertedStatuses) {
      return invertedStatuses;
    }

    invertedStatuses = util.invert(oThis.statuses);

    return invertedStatuses;
  }

  get mandatoryKinds() {
    const oThis = this;

    return { [oThis.globalRabbitmq]: 1 };
  }
}

module.exports = new ConfigStrategy();
