class HeaderHelper {
  constructor() {}

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
    return headers['x-pepo-device-os'];
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

  /**
   * Is reply build.
   *
   * @param {Object} params
   * @param {String} params.deviceOs
   * @param {Number} params.buildNumber
   *
   * @returns {Boolean}
   */
  isReplyBuild(params) {
    const oThis = this;

    if (params.deviceOs === oThis.iosDeviceOs && params.buildNumber >= oThis.iosReplyBuildNumber) {
      return true;
    } else if (params.deviceOs === oThis.androidDeviceOs && params.buildNumber >= oThis.androidReplyBuildNumber) {
      return true;
    }

    return false;
  }

  /**
   * Is video play event build.
   *
   * @param {Object} params
   * @param {String} params.deviceOs
   * @param {Number} params.buildNumber
   *
   * @returns {Boolean}
   */
  isVideoPlayEventBuild(params) {
    const oThis = this;

    if (params.deviceOs === oThis.iosDeviceOs && params.buildNumber >= oThis.iosVideoPlayEventBuildNumber) {
      return true;
    } else if (
      params.deviceOs === oThis.androidDeviceOs &&
      params.buildNumber >= oThis.androidVideoPlayEventBuildNumber
    ) {
      return true;
    }

    return false;
  }
}

module.exports = new HeaderHelper();
