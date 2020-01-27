const rootPrefix = '../../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses, invertedRoles;

/**
 * Class for channel users constants.
 *
 * @class ChannelUsers
 */
class ChannelUsers {
  get adminRole() {
    return 'ADMIN';
  }

  get normalRole() {
    return 'NORMAL';
  }

  get roles() {
    const oThis = this;

    return {
      '1': oThis.adminRole,
      '2': oThis.normalRole
    };
  }

  get invertedRoles() {
    const oThis = this;

    invertedRoles = invertedRoles || util.invert(oThis.roles);

    return invertedRoles;
  }

  get activeStatus() {
    return 'ACTIVE';
  }

  get inactiveStatus() {
    return 'INACTIVE';
  }

  get statuses() {
    const oThis = this;

    return {
      '1': oThis.activeStatus,
      '2': oThis.inactiveStatus
    };
  }

  get invertedStatuses() {
    const oThis = this;

    invertedStatuses = invertedStatuses || util.invert(oThis.statuses);

    return invertedStatuses;
  }
}

module.exports = new ChannelUsers();
