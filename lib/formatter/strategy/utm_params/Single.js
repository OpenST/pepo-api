const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for logged in user formatter.
 *
 * @class UtmParamsFormatter
 */
class UtmParamsFormatter extends BaseFormatter {
  /**
   * Constructor for logged in user formatter.
   *
   * @param {object} params
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.utmParams = params.utmParams || {};
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    return responseHelper.successWithData({});
  }

  /**
   * Format the input object.
   *
   * @returns {*|result}
   * @private
   */
  _format() {
    const oThis = this;

    return responseHelper.successWithData({
      utm_campaign: oThis.utmParams.utmCampaign,
      utm_medium: oThis.utmParams.utmMedium,
      utm_source: oThis.utmParams.utmSource
    });
  }
}

module.exports = UtmParamsFormatter;
