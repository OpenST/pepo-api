/**
 * Formatter for Gifs entity to convert keys to snake case.
 *
 * @module lib/formatter/entity/gif/Map
 */

const rootPrefix = '../../../..',
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  GifSingleFormatter = require(rootPrefix + '/lib/formatter/entity/gif/Single');

/**
 * Class for gifs map formatter.
 *
 * @class
 */
class GifsMapFormatter {
  /**
   * Constructor for gifs Map formatter.
   *
   * @param {object} params
   * @param {object} params.gifMap
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.gifMap = params.gifMap;
  }

  /**
   * Perform
   *
   * @return {{}}
   */
  perform() {
    const oThis = this;

    const finalResponse = {};

    for (const gifId in oThis.gifMap) {
      const gifObj = oThis.gifMap[gifId];

      const formattedGif = new GifSingleFormatter({ gif: gifObj }).perform();

      finalResponse[gifId] = formattedGif.data;
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = GifsMapFormatter;
