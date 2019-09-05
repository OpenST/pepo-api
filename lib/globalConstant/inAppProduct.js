const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses;

/**
 * Class for InAppProducts constants
 *
 * @class InAppProducts
 */
class InAppProductsConstants {
  get active() {
    return 'ACTIVE';
  }

  get inActive() {
    return 'INACTIVE';
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

    invertedStatuses = invertedStatuses ? invertedStatuses : util.invert(oThis.statuses);

    return invertedStatuses;
  }
}

module.exports = new InAppProductsConstants();
