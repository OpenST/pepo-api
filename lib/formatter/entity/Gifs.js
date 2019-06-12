/**
 * Formatter for Gifs entity to convert keys to snake case.
 *
 * @module lib/formatter/entity/Gifs
 */

const rootPrefix = '../../..',
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for user formatter.
 *
 * @class
 */
class GifsFormatter {
  /**
   * Constructor for users formatter.
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
        formattedGif = {};

      formattedGif[gifObj.id] = {
        id: gifObj.id,
        kind: gifObj.kind,
        downsized: gifObj.downsized,
        original: gifObj.original
      };

      finalResponse.push(formattedGif);
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = GifsFormatter;
