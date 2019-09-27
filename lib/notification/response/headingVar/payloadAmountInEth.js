const rootPrefix = '../../../..',
  HeadingVarBase = require(rootPrefix + '/lib/notification/response/headingVar/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for PayloadAmountInEth heading var.
 *
 * @class PayloadAmountInEth
 */
class PayloadAmountInEth extends HeadingVarBase {
  /**
   * Perform for get template var data.
   *
   * @returns {Promise<*>}
   */
  perform() {
    const oThis = this;

    return oThis.getVarData();
  }

  /**
   * Get data for entity.
   *
   * @returns {object}
   */
  getVarData() {
    const oThis = this;

    return responseHelper.successWithData({
      replaceText: oThis.payload.amountInEth
    });
  }
}

module.exports = PayloadAmountInEth;
