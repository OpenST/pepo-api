const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

/**
 * Class for page constants.
 *
 * @class
 */
class pageConstant {
  get optInEmailLink() {
    const oThis = this;
    return coreConstants.PA_DOMAIN + '/' + oThis.doubleOptInWebPath;
  }

  get doubleOptInWebPath() {
    return '/doptin';
  }

  // get view url

  get viewLink() {
    return coreConstants.PA_VIEW_DOMAIN + '/' + coreConstants.PA_VIEW_SUBENV;
  }

  get viewTokenPath() {
    return '/token/th-';
  }

  viewUrlForUser(chainId, UBTAddress, userTokenHolderAddress) {
    const oThis = this;
    return oThis.viewLink + oThis.viewTokenPath + chainId + '-' + UBTAddress + '-' + userTokenHolderAddress;
  }
}

module.exports = new pageConstant();
