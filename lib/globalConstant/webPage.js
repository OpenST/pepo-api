const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

/**
 * Class for web page constants.
 *
 * @class WebPageConstant
 */
class WebPageConstant {
  /**
   * Get opt in email.
   *
   * @returns {string}
   */
  get optInEmailLink() {
    const oThis = this;
    return coreConstants.PA_DOMAIN + oThis.doubleOptInWebPath;
  }

  /**
   * Get double opt in web path.
   *
   * @returns {string}
   */
  get doubleOptInWebPath() {
    return '/doptin';
  }
}

module.exports = new WebPageConstant();
