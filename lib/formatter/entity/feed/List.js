/**
 * Formatter for Feeds entity to convert keys to snake case.
 *
 * @module lib/formatter/entity/feed/List
 */

const rootPrefix = '../../../..',
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  FeedSingleFormatter = require(rootPrefix + '/lib/formatter/entity/feed/Single');

/**
 * Class for feeds list formatter.
 *
 * @class FeedsListFormatter
 */
class FeedsListFormatter {
  /**
   * Constructor for feeds list formatter.
   *
   * @param {object} params
   * @param {array} params.feedIds
   * @param {object} params.feedIdToFeedDetailsMap
   *
   * @param {number} params.feeds.id
   * @param {string} params.feeds.kind
   * @param {string} params.feeds.status
   * @param {number} params.feeds.published_ts
   * @param {number} params.feeds.updated_at
   * @param {object} params.feeds.payload
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.feedIds = params.feedIds;
    oThis.feedIdToFeedDetailsMap = params.feedIdToFeedDetailsMap;
  }

  /**
   * Perform.
   *
   * @return {{}}
   */
  perform() {
    const oThis = this;

    const finalResponse = [];

    for (let index = 0; index < oThis.feedIds.length; index++) {
      const feedId = oThis.feedIds[index],
        feedObj = oThis.feedIdToFeedDetailsMap[feedId];

      const formattedFeed = new FeedSingleFormatter({ feed: feedObj }).perform();
      finalResponse.push(formattedFeed.data);
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = FeedsListFormatter;
