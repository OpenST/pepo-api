const rootPrefix = '../../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses;

/**
 * Class for in app products constants
 *
 * @class InAppProducts
 */
class InAppProductConstants {
  get active() {
    return 'ACTIVE';
  }

  get inActive() {
    return 'INACTIVE';
  }

  get lifetimeLimit() {
    return 1000;
  }

  get dailyLimit() {
    return 10;
  }

  get weeklyLimit() {
    return 20;
  }

  get monthlyLimit() {
    return 50;
  }

  get android() {
    return 'android';
  }

  get ios() {
    return 'ios';
  }

  get statuses() {
    const oThis = this;

    return {
      '1': oThis.active,
      '2': oThis.inActive
    };
  }

  get invertedStatuses() {
    const oThis = this;

    invertedStatuses = invertedStatuses || util.invert(oThis.statuses);

    return invertedStatuses;
  }
}

module.exports = new InAppProductConstants();
