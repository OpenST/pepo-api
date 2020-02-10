const rootPrefix = '../../..',
  util = require(rootPrefix + '/lib/util');

let invertedRoles, invertedNotificationStatuses, invertedStatuses;

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

  get activeNotificationStatus() {
    return 'ACTIVE';
  }

  get inactiveNotificationStatus() {
    return 'INACTIVE';
  }

  get notificationStatuses() {
    const oThis = this;

    return {
      '1': oThis.activeNotificationStatus,
      '2': oThis.inactiveNotificationStatus
    };
  }

  get invertedNotificationStatuses() {
    const oThis = this;

    invertedNotificationStatuses = invertedNotificationStatuses || util.invert(oThis.notificationStatuses);

    return invertedNotificationStatuses;
  }

  get activeStatus() {
    return 'ACTIVE';
  }

  get inactiveStatus() {
    return 'INACTIVE';
  }

  get blockedStatus() {
    return 'BLOCKED';
  }

  get statuses() {
    const oThis = this;

    return {
      '1': oThis.activeStatus,
      '2': oThis.inactiveStatus,
      '3': oThis.blockedStatus
    };
  }

  get invertedStatuses() {
    const oThis = this;

    invertedStatuses = invertedStatuses || util.invert(oThis.statuses);

    return invertedStatuses;
  }
}

module.exports = new ChannelUsers();
