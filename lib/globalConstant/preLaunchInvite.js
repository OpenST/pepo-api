const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses, invertedAdminStatuses;

/**
 * Class for pre launch invite constants.
 *
 * @class PreLaunchInvite
 */
class PreLaunchInvite {
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

    invertedStatuses = invertedStatuses || util.invert(oThis.statuses);

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

    invertedAdminStatuses = invertedAdminStatuses || util.invert(oThis.adminStatuses);

    return invertedAdminStatuses;
  }

  get dataCookieName() {
    return 'paplid';
  }

  get dataCookieExpiryTime() {
    return 60 * 60 * 24 * 360; // 360 day
  }

  get defaultInviteCodeLength() {
    return 6;
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

  get ascendingSortByValue() {
    return 'asc';
  }

  get descendingSortByValue() {
    return 'desc';
  }

  get ascendingStatusSortByValue() {
    return 'sts_asc';
  }

  get descendingStatusSortByValue() {
    return 'sts_desc';
  }

  get sortByValuesMap() {
    const oThis = this;

    return {
      [oThis.ascendingSortByValue]: 1,
      [oThis.descendingSortByValue]: 1,
      [oThis.ascendingStatusSortByValue]: 1,
      [oThis.descendingStatusSortByValue]: 1
    };
  }
}

module.exports = new PreLaunchInvite();
