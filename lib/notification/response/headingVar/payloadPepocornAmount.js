const rootPrefix = '../../../..',
  basicHelper = require(rootPrefix + '/helpers/basic'),
  HeadingVarBase = require(rootPrefix + '/lib/notification/response/headingVar/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for PayloadPepocornAmount heading var.
 *
 * @class PayloadPepocornAmount
 */
class PayloadPepocornAmount extends HeadingVarBase {
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
      replaceText: oThis.payload.pepocornAmount
    });
  }
}

module.exports = PayloadPepocornAmount;
