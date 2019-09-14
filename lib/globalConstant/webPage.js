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

  get redemptionProductPagePath() {
    return '/redemptions/products';
  }

  /**
   * Get double opt in web path.
   *
   * @returns {string}
   */
  get doubleOptInWebPath() {
    return '/doptin';
  }

  /**
   * redemption product link
   *
   * @return {string}
   */
  get redemptionProductLink() {
    const oThis = this;

    return coreConstants.PA_DOMAIN + oThis.redemptionProductPagePath;
  }
}

module.exports = new WebPageConstant();
