const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses;

/**
 * Class for pre launch invite constants.
 *
 * @class
 */
class PreLaunchInvite {
  /**
   * Constructor for pre launch invite constants.
   *
   * @constructor
   */
  constructor() {}

  get pendingStatus() {
    return 'PENDING';
  }

  get doptinStatus() {
    return 'DOPTIN';
  }

  get blockedStatus() {
    return 'BLOCKED';
  }

  get statuses() {
    const oThis = this;

    return {
      '1': oThis.pendingStatus,
      '2': oThis.doptinStatus,
      '3': oThis.blockedStatus
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

  get dataCookieName() {
    return 'paplid';
  }

  get dataCookieExpiryTime() {
    return 60 * 60 * 24 * 360; // 360 day
  }

  get loginCookieName() {
    return 'paplic';
  }

  get csrfCookieName() {
    return '_pli_csrf';
  }

  get loginCookieExpiryTime() {
    return 60 * 60 * 24; // 1 day
  }
}

module.exports = new PreLaunchInvite();
