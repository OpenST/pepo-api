const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedDeviceKinds = null;

class UserDeviceConstants {
  get androidDeviceKind() {
    return 'ANDROID';
  }

  get iosDeviceKind() {
    return 'IOS';
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

    if (invertedDeviceKinds) {
      return invertedDeviceKinds;
    }

    invertedDeviceKinds = util.invert(oThis.userDeviceKinds);

    return invertedDeviceKinds;
  }
}

module.exports = new UserDeviceConstants();
