/**
 * Class for header helpers.
 *
 * @class HeaderHelper
 */
class HeaderHelper {
  //Todo:Web-Login check usage

  pepoDeviceId(headers) {
    return headers['x-pepo-device-id'] || '';
  }

  pepoBuildNumber(headers) {
    return Number(headers['x-pepo-build-number'] || 0);
  }

  pepoAppVersion(headers) {
    return headers['x-pepo-app-version'] || '';
  }

  pepoDeviceOs(headers) {
    return headers['x-pepo-device-os'] || '';
  }

  fingerprintId(headers) {
    return headers['x-pepo-fingerprint-id'] || '';
  }

  get androidDeviceOs() {
    return 'android';
  }

  get iosDeviceOs() {
    return 'ios';
  }

  get iosReplyBuildNumber() {
    return 23;
  }

  get androidReplyBuildNumber() {
    return 20;
  }

  get iosVideoPlayEventBuildNumber() {
    return 15;
  }

  get androidVideoPlayEventBuildNumber() {
    return 14;
  }

  get iosParisRelease2020BuildNumber() {
    return 29;
  }

  get androidParisRelease2020BuildNumber() {
    return 31;
  }

  /**
   * Is reply build?
   *
   * @param {object} headers
   *
   * @returns {boolean}
   */
  isReplyBuild(headers) {
    const oThis = this;

    const deviceOs = oThis.pepoDeviceOs(headers),
      buildNumber = oThis.pepoBuildNumber(headers);

    if (deviceOs === oThis.iosDeviceOs && buildNumber >= oThis.iosReplyBuildNumber) {
      return true;
    } else if (deviceOs === oThis.androidDeviceOs && buildNumber >= oThis.androidReplyBuildNumber) {
      return true;
    }

    return false;
  }

  /**
   * Is video play event build?
   *
   * @param {object} headers
   *
   * @returns {boolean}
   */
  isVideoPlayEventBuild(headers) {
    const oThis = this;

    const deviceOs = oThis.pepoDeviceOs(headers),
      buildNumber = oThis.pepoBuildNumber(headers);

    if (deviceOs === oThis.iosDeviceOs && buildNumber >= oThis.iosVideoPlayEventBuildNumber) {
      return true;
    } else if (deviceOs === oThis.androidDeviceOs && buildNumber >= oThis.androidVideoPlayEventBuildNumber) {
      return true;
    }

    return false;
  }

  /**
   * Is paris release 2020 build?
   *
   * @param {object} headers
   *
   * @returns {boolean}
   */
  isBuildAfterParisRelease2020(headers) {
    const oThis = this;

    const deviceOs = oThis.pepoDeviceOs(headers),
      buildNumber = oThis.pepoBuildNumber(headers);

    if (deviceOs === oThis.iosDeviceOs && buildNumber > oThis.iosParisRelease2020BuildNumber) {
      return true;
    } else if (deviceOs === oThis.androidDeviceOs && buildNumber > oThis.androidParisRelease2020BuildNumber) {
      return true;
    }

    return false;
  }
}

module.exports = new HeaderHelper();
