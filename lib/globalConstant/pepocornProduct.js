const BigNumber = require('bignumber.js');

const rootPrefix = '../..',
  basicHelper = require(rootPrefix + '/helpers/basic');

/**
 * Class to get pepocorn product constants
 *
 */
class PepocornProductConstants {
  get productId() {
    return 'pc1';
  }

  get productName() {
    return 'Pepocorn';
  }

  get productStepFactor() {
    return 1;
  }

  pepoPerStepFactor(step, usdPricePoint) {
    let peposInOneUsd = new BigNumber(1).div(new BigNumber(usdPricePoint));
    let pepoInWeiPerStep = peposInOneUsd.mul(new BigNumber(step)).mul(new BigNumber(10).toPower(18));
    return pepoInWeiPerStep.toFixed(0);
  }

  get dollarInOneStepFactor() {
    return 1;
  }

  get appUpgradeEntity() {
    return {
      ios: {
        message: 'In order to use this functionality, please upgrade the app',
        cta_text: 'Update App',
        cta_url: 'https://google.com'
      },
      android: {
        message: 'In order to use this functionality, please upgrade the app',
        cta_text: 'Update App',
        cta_url: 'https://youtube.com'
      }
    };
  }
}

module.exports = new PepocornProductConstants();
