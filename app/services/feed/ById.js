const rootPrefix = '../../..',
  FeedBase = require(rootPrefix + '/app/services/feed/Base'),
  FeedByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/FeedByIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for feed details by id.
 *
 * @class FeedById
 */
class FeedById extends FeedBase {
  /**
   * Constructor for feed details by id.
   *
   * @param {object} params
   * @param {object} params.current_user
   * @param {number/string} params.feed_id
   *
   * @augments FeedBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.feedId = params.feed_id;
  }

  /**
   * Validate and sanitize.
   *
   * @sets oThis.currentUserId
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    if (oThis.currentUser) {
      oThis.currentUserId = Number(oThis.currentUser.id);
    } else {
      oThis.currentUserId = 0;
    }

    return responseHelper.successWithData({});
  }

  /**
   * Set feed ids.
   *
   * @sets oThis.feedIds, oThis.feedsMap
   *
   * @returns {Promise<*>}
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
   * Prepare response.
   *
   * @returns {*|result}
   * @private
   */
  _prepareResponse() {
    const oThis = this;

    return responseHelper.successWithData({
      feed: oThis.feeds[0], // For this service, feeds array will contain only one element.
      userProfilesMap: oThis.profileResponse.userProfilesMap,
      userProfileAllowedActions: oThis.profileResponse.userProfileAllowedActions,
      usersByIdMap: oThis.profileResponse.usersByIdMap,
      tokenUsersByUserIdMap: oThis.profileResponse.tokenUsersByUserIdMap,
      imageMap: oThis.profileResponse.imageMap,
      videoMap: oThis.profileResponse.videoMap,
      linkMap: oThis.profileResponse.linkMap,
      tags: oThis.profileResponse.tags,
      userStat: oThis.profileResponse.userStat,
      videoDetailsMap: oThis.profileResponse.videoDetailsMap,
      videoDescription: oThis.profileResponse.videoDescription,
      currentUserUserContributionsMap: oThis.profileResponse.currentUserUserContributionsMap,
      currentUserVideoContributionsMap: oThis.profileResponse.currentUserVideoContributionsMap,
      pricePointsMap: oThis.profileResponse.pricePointsMap,
      tokenDetails: oThis.tokenDetails
    });
  }
}

module.exports = FeedById;
