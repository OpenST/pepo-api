/**
 * Formatter for User Feeds entity to convert keys to snake case.
 *
 * @module lib/formatter/entity/feed/List
 */

const rootPrefix = '../../../..',
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  UserFeedSingleFormatter = require(rootPrefix + '/lib/formatter/entity/userFeed/Single');

/**
 * Class for User Feeds entity to convert keys to snake case.
 *
 * @class UserFeedsListFormatter
 */
class UserFeedsListFormatter {
  /**
   * Constructor for User Feeds entity to convert keys to snake case.
   *
   * @param {object} params
   * @param {array} params.userFeedIds
   * @param {object} params.userFeedIdToUserFeedDetailsMap
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

    oThis.userFeedIds = params.userFeedIds;
    oThis.userFeedIdToUserFeedDetailsMap = params.userFeedIdToUserFeedDetailsMap;
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

    for (let index = 0; index < oThis.userFeedIds.length; index++) {
      const userFeedId = oThis.userFeedIds[index],
        userFeedObj = oThis.userFeedIdToUserFeedDetailsMap[userFeedId],
        feedObj = oThis.feedIdToFeedDetailsMap[userFeedIdToUserFeedDetailsMap[userFeedId].feedId];

      const formattedFeed = new UserFeedSingleFormatter({ feed: feedObj, userFeed: userFeedObj }).perform();
      finalResponse.push(formattedFeed.data);
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = UserFeedsListFormatter;
