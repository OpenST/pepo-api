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
      downsized: { isNullAllowed: false },
      fixed_height: { isNullAllowed: false },
      fixed_height_downsampled: { isNullAllowed: false },
      fixed_width: { isNullAllowed: false },
      fixed_width_downsampled: { isNullAllowed: false },
      original: { isNullAllowed: false },
      preview_gif: { isNullAllowed: false },
      preview_webp: { isNullAllowed: true },
      tags: { isNullAllowed: true }
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
      downsized: oThis.gif.downsized,
      fixed_height: oThis.gif.fixed_height,
      fixed_height_downsampled: oThis.gif.fixed_height_downsampled,
      fixed_width: oThis.gif.fixed_width,
      fixed_width_downsampled: oThis.gif.fixed_width_downsampled,
      original: oThis.gif.original,
      preview_gif: oThis.gif.preview_gif,
      preview_webp: oThis.gif.preview_webp || null,
      tags: oThis.gif.tags || []
    });
  }
}

module.exports = GifSingleFormatter;
