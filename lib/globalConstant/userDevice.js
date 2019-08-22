const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedDeviceType = null;

class DeviceTypeConstants {
  get androidDeviceType() {
    return 'ANDROID';
  }

  get iosDeviceType() {
    return 'IOS';
  }

  get userDeviceTypes() {
    const oThis = this;

    return {
      '1': oThis.androidDeviceType,
      '2': oThis.iosDeviceType
    };
  }

  get invertedUserDeviceTypes() {
    const oThis = this;

    if (invertedDeviceType) {
      return invertedDeviceType;
    }

    invertedDeviceType = util.invert(oThis.userDeviceTypes);

    return invertedDeviceType;
  }
}

module.exports = new DeviceTypeConstants();
