/**
 * Formatter for Single User Feed entity to convert keys to snake case.
 *
 * @module lib/formatter/entity/feed/Single
 */

const rootPrefix = '../../../..',
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  SingleFeedFormatter = require(rootPrefix + '/lib/formatter/entity/feed/Single');

/**
 * Class for Single User Feed entity to convert keys to snake case.
 *
 * @class UserFeedSingleFormatter
 */
class UserFeedSingleFormatter {
  /**
   * Constructor for Single User Feed entity to convert keys to snake case.
   *
   * @param {object} params
   *
   * @param {object} params.feed
   * @param {number} params.feed.id
   * @param {string} params.feed.kind
   * @param {string} params.feed.status
   * @param {number} params.feed.published_ts
   * @param {number} params.feed.updated_at
   * @param {object} params.feed.payload
   *
   * @param {object} params.userFeed
   * @param {object} params.userFeed.privacyType
   * @param {object} params.userFeed.publishedTs
   * @param {object} params.userFeed.updatedAt
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.feed = params.feed;
    oThis.userFeed = params.userFeed;
  }

  /**
   * Perform.
   *
   * @return {{}}
   */
  perform() {
    const oThis = this;

    const formattedFeedDataResp = new SingleFeedFormatter({ feed: oThis.feed }).perform();

    const formattedFeedData = formattedFeedDataResp.data;

    formattedFeedData.privacy_type = oThis.userFeed.privacyType;
    formattedFeedData.published_ts = oThis.userFeed.publishedTs;
    formattedFeedData.updated_at = oThis.userFeed.updatedAt;

    return responseHelper.successWithData(formattedFeedData);
  }
}

module.exports = UserFeedSingleFormatter;
