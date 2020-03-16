const rootPrefix = '../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for redirect url formatter.
 *
 * @class RedirectUrl
 */
class RedirectUrl extends BaseFormatter {
  /**
   * Constructor for redirect url formatter.
   *
   * @param {object} params
   * @param {object} params.redirectUrl
   * @param {string} params.redirectUrl.url
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.redirectUrl = params.redirectUrl;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const redirectUrlConfig = {
      url: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.redirectUrl, redirectUrlConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {object}
   * @private
   */
  _format() {
    const oThis = this;

    return responseHelper.successWithData({
      url: oThis.redirectUrl.url
    });
  }
}

module.exports = RedirectUrl;
