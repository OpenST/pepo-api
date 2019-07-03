const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UrlSingleFormatter = require(rootPrefix + '/lib/formatter/strategy/url/Single'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for urls map formatter.
 *
 * @class UrlsMapFormatter
 */
class UrlsMapFormatter extends BaseFormatter {
  /**
   * Constructor for urls map formatter.
   *
   * @param {object} params
   * @param {object} params.urlMap
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.urlMap = params.urlMap;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    if (!CommonValidators.validateObject(oThis.urlMap)) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_s_u_m_1',
        api_error_identifier: 'entity_formatting_failed',
        debug_options: {}
      });
    }

    return responseHelper.successWithData({});
  }

  /**
   * Format the input object.
   *
   * @returns {result}
   * @private
   */
  _format() {
    const oThis = this;

    const finalResponse = {};

    for (const urlId in oThis.urlMap) {
      const urlObj = oThis.urlMap[urlId],
        formattedUrlRsp = new UrlSingleFormatter({ url: urlObj }).perform();

      if (formattedUrlRsp.isFailure()) {
        return formattedUrlRsp;
      }

      finalResponse[urlId] = formattedUrlRsp.data;
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = UrlsMapFormatter;
