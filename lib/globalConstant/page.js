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
   * @param {string} [userTokenHolderAddress]
   *
   * @returns {string}
   */
  viewUrlForUser(chainId, UBTAddress, userTokenHolderAddress = '') {
    const oThis = this;

    return (
      coreConstants.PA_VIEW_END_POINT + oThis.viewTokenPath + chainId + '-' + UBTAddress + '-' + userTokenHolderAddress
    );
  }

  get twitterEndPoint() {
    return 'https://twitter.com/';
  }

  twitterUrlForUser(handle) {
    const oThis = this;
    return oThis.twitterEndPoint + handle;
  }
}

module.exports = new PageConstant();
