const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

/**
 * Class for page constants.
 *
 * @class PageConstant
 */
class PageConstant {
  /**
   * Get opt in email.
   *
   * @returns {string}
   */
  get optInEmailLink() {
    const oThis = this;

    return coreConstants.PA_DOMAIN + '/' + oThis.doubleOptInWebPath;
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
   * Get view token path.
   *
   * @returns {string}
   */
  get viewTokenPath() {
    return '/token/th-';
  }

  /**
   * Get view url for user.
   *
   * @param {number/string} chainId
   * @param {string} UBTAddress
   * @param {string} userTokenHolderAddress
   *
   * @returns {string}
   */
  viewUrlForUser(chainId, UBTAddress, userTokenHolderAddress) {
    const oThis = this;

    return (
      coreConstants.PA_VIEW_END_POINT + oThis.viewTokenPath + chainId + '-' + UBTAddress + '-' + userTokenHolderAddress
    );
  }
}

module.exports = new PageConstant();
