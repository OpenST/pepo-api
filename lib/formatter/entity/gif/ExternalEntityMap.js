/**
 * Formatter for external entity gifs Map formatter.
 *
 * @module lib/formatter/entity/gif/ExternalEntityMap
 */

const rootPrefix = '../../../..',
  GifMapFormatter = require(rootPrefix + '/lib/formatter/entity/gif/Map');

/**
 * Class for external entity gifs Map formatter.
 *
 * @class ExternalEntityGifsMapFormatter
 */
class ExternalEntityGifsMapFormatter {
  /**
   * Constructor for external entity gifs Map formatter.
   *
   * @param {object} params
   * @param {object} params.externalEntityGifMap
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.externalEntityGifMap = params.externalEntityGifMap;
  }

  /**
   * Perform
   *
   * @return {{}}
   */
  perform() {
    const oThis = this;

    const gifMap = {};

    for (const externalEntityId in oThis.externalEntityGifMap) {
      const externalEntityObj = oThis.externalEntityGifMap[externalEntityId];

      gifMap[externalEntityObj.entityId] = externalEntityObj.extraData;
    }

    return new GifMapFormatter({ gifMap: gifMap }).perform();
  }
}

module.exports = ExternalEntityGifsMapFormatter;
