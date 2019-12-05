const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedDeviceOs;

/**
 * Class for user device extended detail constants.
 *
 * @class UserDeviceExtendedDetailConstants
 */
class UserDeviceExtendedDetailConstants {
  get androidDeviceOs() {
    return 'android';
  }

  get iosDeviceOs() {
    return 'ios';
  }

  get deviceOs() {
    const oThis = this;

    return {
      '1': oThis.androidDeviceOs,
      '2': oThis.iosDeviceOs
    };
  }

  get invertedDeviceOs() {
    const oThis = this;

    invertedDeviceOs = invertedDeviceOs || util.invert(oThis.deviceOs);

    return invertedDeviceOs;
  }
}

module.exports = new UserDeviceExtendedDetailConstants();
