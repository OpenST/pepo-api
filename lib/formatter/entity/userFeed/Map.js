/**
 * Formatter for User Feeds entity to convert keys to snake case.
 *
 * @module lib/formatter/entity/feed/Map
 */

const rootPrefix = '../../../..',
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  UserFeedSingleFormatter = require(rootPrefix + '/lib/formatter/entity/userFeed/Single');

/**
 * Class for User Feeds entity to convert keys to snake case.
 *
 * @class UserFeedsMapFormatter
 */
class UserFeedsMapFormatter {
  /**
   * Constructor for User Feeds entity to convert keys to snake case.
   *
   * @param {object} params
   * @param {array} params.feedIds
   * @param {object} params.feedIdToFeedDetailsMap
   * @param {object} params.userFeedIdToFeedDetailsMap
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.feedIds = params.feedIds;
    oThis.feedIdToFeedDetailsMap = params.feedIdToFeedDetailsMap;
    oThis.userFeedIdToFeedDetailsMap = params.userFeedIdToFeedDetailsMap;
  }

  /**
   * Perform
   *
   * @return {{}}
   */
  perform() {
    const oThis = this;

    let finalResponse = {};

    for (let index = 0; index < oThis.feedIds.length; index++) {
      const userFeedId = oThis.feedIds[index];

      const userFeedObj = oThis.userFeedIdToFeedDetailsMap[userFeedId],
        feedObj = oThis.feedIdToFeedDetailsMap[userFeedId],
        formattedFeed = new UserFeedSingleFormatter({ feed: feedObj, userFeed: userFeedObj }).perform();

      const tempResponse = { [userFeedId]: formattedFeed.data };

      finalResponse = Object.assign(finalResponse, finalResponse, tempResponse);
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = UserFeedsMapFormatter;
