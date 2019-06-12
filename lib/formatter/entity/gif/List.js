/**
 * Formatter for Gifs entity to convert keys to snake case.
 *
 * @module lib/formatter/entity/gif/List
 */

const rootPrefix = '../../../..',
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  GifSingleFormatter = require(rootPrefix + '/lib/formatter/entity/gif/Single');

/**
 * Class for gifs list formatter.
 *
 * @class
 */
class GifsListFormatter {
  /**
   * Constructor for gifs list formatter.
   *
   * @param {Object} params
   * @param {Object} params.gifs
   *
   * @param {String} params.gifs.id
   * @param {String} params.gifs.kind
   * @param {Object} params.gifs.downsized
   * @param {Object} params.gifs.original
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.gifs = params.gifs;
  }

  /**
   * Perform
   *
   * @return {{}}
   */
  perform() {
    const oThis = this;

    let finalResponse = [];
    for (let index = 0; index < oThis.gifs.length; index++) {
      let gifObj = oThis.gifs[index],
        formattedGif = new GifSingleFormatter({ gif: gifObj }).perform();

      finalResponse.push(formattedGif.data);
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = GifsListFormatter;
