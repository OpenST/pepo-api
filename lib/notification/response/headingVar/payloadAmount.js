const rootPrefix = '../../../..',
  basicHelper = require(rootPrefix + '/helpers/basic'),
  HeadingVarBase = require(rootPrefix + '/lib/notification/response/headingVar/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for PayloadAmount heading var.
 *
 * @class PayloadAmount
 */
class PayloadAmount extends HeadingVarBase {
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

    let amount = basicHelper.convertWeiToNormal(oThis.payload.amount);

    return responseHelper.successWithData({
      replaceText: amount
    });
  }
}

module.exports = PayloadAmount;
