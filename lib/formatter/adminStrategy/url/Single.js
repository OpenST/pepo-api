const urlParser = require('url');

const rootPrefix = '../../../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for Feed formatter.
 *
 * @class UrlSingleFormatter
 */
class UrlSingleFormatter extends BaseFormatter {
  /**
   * Constructor for get Url Details formatter.
   *
   * @param {object} params
   * @param {object} params.url
   *
   * @param {number} params.url.id
   * @param {string} params.url.url
   * @param {string} params.url.kind
   * @param {number} params.url.createdAt
   * @param {number} params.url.updatedAt
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.url = params.url;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const urlKeyConfig = {
      id: { isNullAllowed: false },
      url: { isNullAllowed: false },
      kind: { isNullAllowed: false },
      createdAt: { isNullAllowed: false },
      updatedAt: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.url, urlKeyConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {*|result}
   * @private
   */
  _format() {
    const oThis = this;

    let url = oThis.url.url,
      sanitizedUrl = null;

    const parsedUrl = urlParser.parse(url, true);

    if (CommonValidators.validateNonEmptyHttpBasedUrl(url)) {
      sanitizedUrl = parsedUrl.href;
    } else {
      sanitizedUrl = 'http://' + url;
    }

    return responseHelper.successWithData({
      id: Number(oThis.url.id),
      url: sanitizedUrl,
      kind: oThis.url.kind,
      uts: Number(oThis.url.updatedAt)
    });
  }
}

module.exports = UrlSingleFormatter;
