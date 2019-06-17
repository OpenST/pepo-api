/**
 * Formatter for feeds map entity to convert keys to snake case.
 *
 * @module lib/formatter/entity/feed/Map
 */

const rootPrefix = '../../../..',
  FeedSingleFormatter = require(rootPrefix + '/lib/formatter/entity/feed/Single'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for feeds map formatter.
 *
 * @class FeedsMapFormatter
 */
class FeedsMapFormatter {
  /**
   * Constructor for feeds map formatter.
   *
   * @param {object} params
   * @param {object} params.feedMap
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

    const finalResponse = {};

    for (const feedId in oThis.feedMap) {
      const feedObj = oThis.feedMap[feedId],
        formattedFeed = new FeedSingleFormatter({ feed: feedObj }).perform();

      finalResponse[feedId] = formattedFeed.data;
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = FeedsMapFormatter;
