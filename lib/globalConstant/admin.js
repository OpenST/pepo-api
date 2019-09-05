const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses;

/**
 * Class for admin related constants.
 *
 * @class
 */
class Admin {
  /**
   *
   * @constructor
   */
  constructor() {}

  get activeStatus() {
    return 'ACTIVE';
  }

  get inActiveStatus() {
    return 'INACTIVE';
  }

  get statuses() {
    const oThis = this;

    return {
      '1': oThis.activeStatus,
      '2': oThis.inActiveStatus
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

  get loginCookieName() {
    return 'palc';
  }

  get csrfCookieName() {
    return '_ad_csrf';
  }

  get cookieExpiryTime() {
    return 60 * 60 * 24; // 1 day
  }
}

module.exports = new Admin();
