const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

/**
 * Class for web page constants.
 *
 * @class WebPageConstant
 */
class WebPageConstant {
  get doubleOptInWebPath() {
    return '/doptin';
  }

  get optInEmailLink() {
    const oThis = this;

    return coreConstants.PA_DOMAIN + oThis.doubleOptInWebPath;
  }
}

module.exports = new WebPageConstant();
