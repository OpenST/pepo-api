const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses;

/**
 * Class for Twitter Auth Token constants.
 *
 * @class
 */
class twitterAuthToken {
  /**
   * Constructor for Twitter Auth Token constants.
   *
   * @constructor
   */
  constructor() {}

  get activeStatus() {
    return 'ACTIVE';
  }

  get inactiveStatus() {
    return 'INACTIVE';
  }

  get expiredStatus() {
    return 'EXPIRED';
  }

  get statuses() {
    const oThis = this;

    return {
      '1': oThis.activeStatus,
      '2': oThis.inactiveStatus,
      '3': oThis.expiredStatus
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

module.exports = new twitterAuthToken();
