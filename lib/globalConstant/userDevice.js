const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedDeviceKinds = null,
  invertedStatuses = null;

/**
 * Class for user device constants.
 *
 * @class UserDeviceConstants
 */
class UserDeviceConstants {
  get androidDeviceKind() {
    return 'ANDROID';
  }

  get iosDeviceKind() {
    return 'IOS';
  }

  get activeStatus() {
    return 'ACTIVE';
  }

  get expiredStatus() {
    return 'EXPIRED';
  }

  get logoutStatus() {
    return 'LOGOUT';
  }

  get userDeviceKinds() {
    const oThis = this;

    return {
      '1': oThis.androidDeviceKind,
      '2': oThis.iosDeviceKind
    };
  }

  get invertedUserDeviceKinds() {
    const oThis = this;

    invertedDeviceKinds = invertedDeviceKinds || util.invert(oThis.userDeviceKinds);

    return invertedDeviceKinds;
  }

  get statuses() {
    const oThis = this;

    return {
      '1': oThis.activeStatus,
      '2': oThis.expiredStatus,
      '3': oThis.logoutStatus
    };
  }

  get invertedStatuses() {
    const oThis = this;

    invertedStatuses = invertedStatuses || util.invert(oThis.statuses);

    return invertedStatuses;
  }
}

module.exports = new UserDeviceConstants();
