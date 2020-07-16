const rootPrefix = '../..',
  basicHelper = require(rootPrefix + '/helpers/basic');

/**
 * Class for token constants.
 *
 * @class Token
 */
class Token {
  get airdropAmountInUsd() {
    return 0.01;
  }

  /**
   * Get pepo airdrop amount in wei.
   *
   * @param {string} usdInOneOst
   *
   * @returns {string}
   */
  getPepoAirdropAmountInWei(usdInOneOst) {
    const oThis = this;

    // const pepoAmountInWei = basicHelper.getPepoAmountForUSD(usdInOneOst, oThis.airdropAmountInUsd);

    // let pepoAmount = Number(basicHelper.convertWeiToNormal(pepoAmountInWei).toFixed(0));

    // pepoAmount -= pepoAmount % 10;
    
    const pepoAmount = 1;

    return basicHelper.convertToWei(pepoAmount).toString(10);
  }
}

module.exports = new Token();
