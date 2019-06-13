/**
 * Formatter for Single Gif entity to convert keys to snake case.
 *
 * @module lib/formatter/entity/gif/Single
 */

const rootPrefix = '../../../..',
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for Gif formatter.
 *
 * @class
 */
class GifSingleFormatter {
  /**
   * Constructor for Gif formatter.
   *
   * @param {Object} params
   * @param {Object} params.gif
   *
   * @param {String} params.gif.id
   * @param {String} params.gif.kind
   * @param {Object} params.gif.downsized
   * @param {Object} params.gif.original
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.gif = params.gif;
  }

  /**
   * Perform
   *
   * @return {{}}
   */
  perform() {
    const oThis = this;

    return responseHelper.successWithData({
      id: oThis.gif.id,
      kind: oThis.gif.kind,
      fixed_width: oThis.gif.fixed_width,
      fixed_width_downsampled: oThis.gif.fixed_width_downsampled,
      fixed_width_small: oThis.gif.fixed_width_small
    });
  }
}

module.exports = GifSingleFormatter;
