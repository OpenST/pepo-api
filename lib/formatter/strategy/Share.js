const rootPrefix = '../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for fetch goto formatter.
 *
 * @class FetchGoto
 */
class FetchGoto extends BaseFormatter {
  /**
   * Constructor for device formatter.
   *
   * @param {object} params
   * @param {object} params.share
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.share = params.share;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const shareConfig = {
      id: { isNullAllowed: false },
      uts: { isNullAllowed: false },
      kind: { isNullAllowed: false },
      url: { isNullAllowed: false },
      message: { isNullAllowed: false },
      title: { isNullAllowed: true },
      subject: { isNullAllowed: true }
    };

    return oThis.validateParameters(oThis.share, shareConfig);
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
      id: oThis.share.id,
      kind: oThis.share.kind,
      url: oThis.share.url,
      poster_image_url: oThis.share.posterImageUrl || null,
      message: oThis.share.message,
      title: oThis.share.title || null,
      subject: oThis.share.subject || null,
      uts: Number(oThis.share.uts)
    });
  }
}

module.exports = FetchGoto;
