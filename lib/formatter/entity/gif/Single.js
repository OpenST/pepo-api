const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for Gif formatter.
 *
 * @class GifSingleFormatter
 */
class GifSingleFormatter extends BaseFormatter {
  /**
   * Constructor for Gif formatter.
   *
   * @param {object} params
   * @param {object} params.gif
   *
   * @param {string} params.gif.id
   * @param {string} params.gif.kind
   * @param {object} params.gif.downsized
   * @param {object} params.gif.original
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.gif = params.gif;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const gifKeyConfig = {
      id: { isNullAllowed: false },
      kind: { isNullAllowed: false },
      fixed_width_downsampled: { isNullAllowed: false },
      downsized: { isNullAllowed: false }
    };

    return oThis._validateParameters(oThis.gif, gifKeyConfig);
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
      id: oThis.gif.id,
      kind: oThis.gif.kind,
      fixed_width_downsampled: oThis.gif.fixed_width_downsampled,
      downsized: oThis.gif.downsized
    });
  }
}

module.exports = GifSingleFormatter;
