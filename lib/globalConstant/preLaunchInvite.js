const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses, invertedAdminStatuses, invertedCreators;

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

  get whitelistPendingStatus() {
    return 'WHITELIST_PENDING';
  }

  get whitelistedStatus() {
    return 'WHITELISTED';
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

  get notAppliedCreator() {
    return 'NOT_APPLIED';
  }

  get appliedCreator() {
    return 'APPLIED';
  }

  get approvedCreator() {
    return 'APPROVED';
  }

  get creatorStatuses() {
    const oThis = this;

    return {
      '0': oThis.notAppliedCreator,
      '1': oThis.appliedCreator,
      '2': oThis.approvedCreator
    };
  }

  get invertedCreators() {
    const oThis = this;

    invertedCreators = invertedCreators || util.invert(oThis.creatorStatuses);

    return invertedCreators;
  }

  get dataCookieName() {
    return 'pli_d';
  }

  get dataCookieExpiryTime() {
    return 60 * 60 * 24 * 30; // 30 day
  }

  get defaultInviteCodeLength() {
    return 6;
  }

  get loginCookieName() {
    return 'pli_c';
  }

  get csrfCookieName() {
    return '_cu_csrf';
  }

  get loginCookieExpiryTime() {
    return 60 * 60 * 24 * 30; // 30 day
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
