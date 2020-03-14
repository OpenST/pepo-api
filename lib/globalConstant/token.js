const rootPrefix = '../..',
  basicHelper = require(rootPrefix + '/helpers/basic');

/**
 * Class for token constants.
 *
 * @class Token
 */
class Token {
  get airdropAmountInUsd() {
    return 5;
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

    const pepoAmountInWei = basicHelper.getPepoAmountForUSD(usdInOneOst, oThis.airdropAmountInUsd);

    let pepoAmount = Number(basicHelper.convertWeiToNormal(pepoAmountInWei).toFixed(0));

    pepoAmount -= pepoAmount % 10;

    return basicHelper.convertToWei(pepoAmount).toString(10);
  }
}

module.exports = new Token();
