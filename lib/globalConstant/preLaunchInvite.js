const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses, invertedAdminStatuses, invertedCreatorStatuses;

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

  get notAppliedCreatorStatus() {
    return 'NOT_APPLIED';
  }

  get appliedCreatorStatus() {
    return 'APPLIED';
  }

  get approvedCreatorStatus() {
    return 'APPROVED';
  }

  get creatorStatuses() {
    const oThis = this;

    return {
      '0': oThis.notAppliedCreatorStatus,
      '1': oThis.appliedCreatorStatus,
      '2': oThis.approvedCreatorStatus
    };
  }

  get invertedCreatorStatuses() {
    const oThis = this;

    invertedCreatorStatuses = invertedCreatorStatuses || util.invert(oThis.creatorStatuses);

    return invertedCreatorStatuses;
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
