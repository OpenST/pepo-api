/**
 * Formatter for Feeds entity to convert keys to snake case.
 *
 * @module lib/formatter/entity/feed/Map
 */

const rootPrefix = '../../../..',
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  FeedSingleFormatter = require(rootPrefix + '/lib/formatter/entity/feed/Single');

/**
 * Class for feeds map formatter.
 *
 * @class
 */
class FeedsMapFormatter {
  /**
   * Constructor for feeds Map formatter.
   *
   * @param {Object} params
   * @param {Object} params.feedMap
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.feedMap = params.feedMap;
  }

  /**
   * Perform
   *
   * @return {{}}
   */
  perform() {
    const oThis = this;

    let finalResponse = {};
    for (let feedId in oThis.feedMap) {
      let feedObj = oThis.feedMap[feedId],
        formattedFeed = new FeedSingleFormatter({ feed: feedObj }).perform();

      finalResponse[feedId] = formattedFeed.data;
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = FeedsMapFormatter;
