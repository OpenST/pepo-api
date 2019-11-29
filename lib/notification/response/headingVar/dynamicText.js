const rootPrefix = '../../../..',
  HeadingVarBase = require(rootPrefix + '/lib/notification/response/headingVar/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for DynamicText heading var.
 *
 * @class DynamicText
 */
class DynamicText extends HeadingVarBase {
  /**
   * Perform for get template var data.
   *
   * @returns {object}
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
      replaceText: oThis.payload.dynamicText
    });
  }
}

module.exports = DynamicText;
