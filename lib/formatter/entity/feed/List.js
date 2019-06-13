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
 * @class
 */
class FeedsListFormatter {
  /**
   * Constructor for feeds list formatter.
   *
   * @param {Object} params
   * @param {Object} params.feeds
   *
   * @param {Integer} params.feeds.id
   * @param {String} params.feeds.kind
   * @param {String} params.feeds.status
   * @param {Integer} params.feeds.published_ts
   * @param {Integer} params.feeds.updated_at
   * @param {Object} params.feeds.payload
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.feeds = params.feeds;
  }

  /**
   * Perform
   *
   * @return {{}}
   */
  perform() {
    const oThis = this;

    let finalResponse = [];
    for (let index = 0; index < oThis.feeds.length; index++) {
      let feedObj = oThis.feeds[index],
        formattedFeed = new FeedSingleFormatter({ feed: feedObj }).perform();

      finalResponse.push(formattedFeed.data);
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = FeedsListFormatter;
