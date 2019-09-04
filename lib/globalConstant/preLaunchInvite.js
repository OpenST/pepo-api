const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses, invertedAdminStatuses;

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

  get whitelistPendingStatus() {
    return 'WHITELIST_PENDING';
  }

  get whitelistedStatus() {
    return 'WHITELISTED';
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

  get adminStatuses() {
    const oThis = this;

    return {
      '1': oThis.whitelistPendingStatus,
      '2': oThis.whitelistedStatus
    };
  }

  get invertedAdminStatuses() {
    const oThis = this;

    if (invertedAdminStatuses) {
      return invertedAdminStatuses;
    }

    invertedAdminStatuses = util.invert(oThis.adminStatuses);

    return invertedAdminStatuses;
  }

  get loginCookieName() {
    return 'paplic';
  }

  get csrfCookieName() {
    return '_pli_csrf';
  }

  get cookieExpiryTime() {
    return 60 * 60 * 24; // 1 day
  }
}

module.exports = new PreLaunchInvite();
