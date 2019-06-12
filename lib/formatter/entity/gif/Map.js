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
   * @param {Object} params
   * @param {Object} params.gifMap
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

    let finalResponse = {};
    for (let gifId in oThis.gifMap) {
      let gifObj = oThis.gifMap[gifId],
        formattedGif = new GifSingleFormatter({ gif: gifObj }).perform();

      finalResponse[gifId] = formattedGif.data;
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = GifsMapFormatter;
