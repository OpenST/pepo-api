const BigNumber = require('bignumber.js');

const rootPrefix = '../..',
  basicHelper = require(rootPrefix + '/helpers/basic');

/**
 * Class to get pepocorn product constants
 *
 */
class PepocornProductConstants {
  get productId() {
    return 'pp_1';
  }

  get productName() {
    return 'Pepocorn';
  }

  get productStepFactor() {
    return 1;
  }

  get pepoInOneStepFactor() {
    return basicHelper.convertToLowerUnit('100', 18);
  }

  get dollarInOneStepFactor() {
    return 1;
  }

  get appUpgradeEntity() {
    return {
      ios: {
        message: 'In order to use this functionality, please upgrade the app',
        cta_text: '',
        cta_url: ''
      },
      android: {
        message: 'In order to use this functionality, please upgrade the app',
        cta_text: '',
        cta_url: ''
      }
    };
  }
}

module.exports = new PepocornProductConstants();
