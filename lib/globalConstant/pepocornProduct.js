const BigNumber = require('bignumber.js');

const rootPrefix = '../..',
  basicHelper = require(rootPrefix + '/helpers/basic');

/**
 * Class to get pepocorn product constants
 *
 */
class PepocornProductConstants {
  get productId() {
    return 2;
  }

  get productName() {
    return 'Unicorn';
  }

  get productStepFactor() {
    return 0.01;
  }

  pepoPerStepFactor(step, usdPricePoint) {
    let peposInOneUsd = new BigNumber(1).div(new BigNumber(usdPricePoint));
    let pepoInWeiPerStep = new BigNumber(peposInOneUsd.mul(new BigNumber(step)).toFixed(2)).mul(
      new BigNumber(10).toPower(18)
    );
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
