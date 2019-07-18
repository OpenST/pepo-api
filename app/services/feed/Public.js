const rootPrefix = '../../..',
  FeedBase = require(rootPrefix + '/app/services/feed/Base'),
  LoggedOutFeedCache = require(rootPrefix + '/lib/cacheManagement/single/LoggedOutFeed'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class PublicVideoFeed extends FeedBase {
  /**
   * Constructor for Public Video Feed
   *
   * @param params
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.feeds = [];
    oThis.userIds = [];
    oThis.videoIds = [];
    oThis.profileResponse = {};
    oThis.finalResponse = {};
  }

  /**
   * Validate and Sanitize
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _validateAndSanitizeParams() {
    return responseHelper.successWithData({});
  }

  /**
   * Set feed ids
   *
   * @private
   */
  async _setFeedIds() {
    const oThis = this,
      loggedOutFeedCacheResp = await new LoggedOutFeedCache().fetch();

    oThis.feedIds = loggedOutFeedCacheResp.data.feedIds;
    oThis.feedsMap = loggedOutFeedCacheResp.data.feedDetails;
  }

  /**
   * Prepare Response
   *
   * @returns {*|result}
   * @private
   */
  _prepareResponse() {
    const oThis = this;

    return responseHelper.successWithData({
      feedList: oThis.feeds,
      userProfileDetails: oThis.profileResponse.userProfileDetails,
      userProfileAllowedActions: oThis.profileResponse.userProfileAllowedActions,
      usersByIdMap: oThis.profileResponse.usersByIdMap,
      tokenUsersByUserIdMap: oThis.profileResponse.tokenUsersByUserIdMap,
      imageMap: oThis.profileResponse.imageMap,
      videoMap: oThis.profileResponse.videoMap,
      linkMap: oThis.profileResponse.linkMap,
      tags: oThis.profileResponse.tags,
      userStat: oThis.profileResponse.userStat,
      videoDetailsMap: oThis.profileResponse.videoDetailsMap,
      currentUserUserContributionsMap: oThis.profileResponse.currentUserUserContributionsMap,
      currentUserVideoContributionsMap: oThis.profileResponse.currentUserVideoContributionsMap,
      pricePointsMap: oThis.profileResponse.pricePointsMap
    });
  }
}

module.exports = PublicVideoFeed;
