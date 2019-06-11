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
   * @param {Object} params
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.params = params;
  }

  /**
   * Perform
   *
   * @return {{}}
   */
  perform() {
    const oThis = this;

    let finalResponse = [];

    for (let index in oThis.params) {
      let gifObj = oThis.params[index],
        formattedGif = {};

      formattedGif[gifObj.id] = {
        id: gifObj.id,
        kind: gifObj.type,
        downsized: gifObj.downsized,
        original: gifObj.original
      };

      finalResponse.push(formattedGif);
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = GifsFormatter;
