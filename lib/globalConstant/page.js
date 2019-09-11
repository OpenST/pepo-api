const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

/**
 * Class for page constants.
 *
 * @class PageConstant
 */
class PageConstant {
  /**
   * Get double opt in web path.
   *
   * @returns {string}
   */
  get doubleOptInWebPath() {
    return '/doptin';
  }

  /**
   * Get opt in email.
   *
   * @returns {string}
   */
  get optInEmailLink() {
    const oThis = this;

    return coreConstants.PA_DOMAIN + '/' + oThis.doubleOptInWebPath;
  }
}

module.exports = new PageConstant();
