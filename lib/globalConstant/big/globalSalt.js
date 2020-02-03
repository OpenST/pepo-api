const rootPrefix = '../../..',
  util = require(rootPrefix + '/lib/util');

// Declare constants.
let kinds, invertedKinds, statuses, invertedStatuses;

/**
 * Class for global salts constants.
 *
 * @class GlobalSalt
 */
class GlobalSalt {
  // Global salts kinds start.
  get configStrategyKind() {
    return 'configStrategy';
  }
  // Global salts kinds end.

  // Global salts statuses start.
  get activeStatus() {
    return 'active';
  }

  get inActiveStatus() {
    return 'inActive';
  }
  // Global salts statuses end.

  get kinds() {
    const oThis = this;

    if (kinds) {
      return kinds;
    }

    kinds = {
      '1': oThis.configStrategyKind
    };

    return kinds;
  }

  get statuses() {
    const oThis = this;

    if (statuses) {
      return statuses;
    }

    statuses = {
      '1': oThis.activeStatus,
      null: oThis.inActiveStatus // Value is null because kind and status have a composite index.
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

  get invertedKinds() {
    const oThis = this;

    if (invertedKinds) {
      return invertedKinds;
    }

    invertedKinds = util.invert(oThis.kinds);

    return invertedKinds;
  }
}

module.exports = new GlobalSalt();
