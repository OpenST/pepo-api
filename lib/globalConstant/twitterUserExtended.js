const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses;

/**
 * Class for twitter user extended constants.
 *
 * @class
 */
class TwitterUserExtendedConstants {
  /**
   * Constructor for twitter user extended constants.
   *
   * @constructor
   */
  constructor() {}

  get activeStatus() {
    return 'ACTIVE';
  }

  get expiredStatus() {
    return 'EXPIRED';
  }

  get statuses() {
    const oThis = this;

    return {
      '1': oThis.activeStatus,
      '2': oThis.expiredStatus
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

module.exports = new TwitterUserExtendedConstants();
