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
    return coreConstants.PA_DOMAIN + oThis.doubleOptInWebPath;
  }

  get doubleOptInWebPath() {
    return '/doptin';
  }
}

module.exports = new pageConstant();
