const rootPrefix = '../../..',
  FeedBase = require(rootPrefix + '/app/services/feed/Base'),
  FeedByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/FeedByIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class FeedById extends FeedBase {
  /**
   * Constructor for Feed Details
   *
   * @param params
   */
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.feedId = params.feed_id;
  }

  /**
   * Validate and Sanitize
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    return responseHelper.successWithData({});
  }

  /**
   * Set feed ids
   *
   * @private
   */
  async _setFeedIds() {
    const oThis = this;

    oThis.feedIds = [oThis.feedId];

    const feedByIdsCacheResponse = await new FeedByIdsCache({ ids: oThis.feedIds }).fetch();

    if (feedByIdsCacheResponse.isFailure()) {
      return Promise.reject(feedByIdsCacheResponse);
    }

    oThis.feedsMap = feedByIdsCacheResponse.data;
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
      feed: oThis.feeds[0], // for this service, feeds array will contain only one element
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

module.exports = FeedById;
