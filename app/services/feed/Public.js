const rootPrefix = '../../..',
  FeedBase = require(rootPrefix + '/app/services/feed/Base'),
  LoggedOutFeedCache = require(rootPrefix + '/lib/cacheManagement/single/LoggedOutFeed'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination');

class PublicVideoFeed extends FeedBase {
  /**
   * Constructor for Public Video Feed
   *
   * @param params
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.paginationIdentifier = params[paginationConstants.paginationIdentifierKey] || null;

    console.log('--------oThis.paginationIdentifier-----', oThis.paginationIdentifier);
    oThis.feeds = [];
    oThis.userIds = [];
    oThis.videoIds = [];
    oThis.profileResponse = {};
    oThis.finalResponse = {};

    oThis.limit = oThis._defaultPageLimit();
    oThis.paginationTimestamp = null;
  }

  /**
   * Validate and Sanitize
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

    if (oThis.paginationIdentifier) {
      const parsedPaginationParams = oThis._parsePaginationParams(oThis.paginationIdentifier);

      oThis.paginationTimestamp = parsedPaginationParams.pagination_timestamp; // Override paginationTimestamp number.
    } else {
      oThis.paginationTimestamp = null;
    }

    // Validate limit.
    return oThis._validatePageSize();
  }

  /**
   * Set feed ids
   *
   * @private
   */
  async _setFeedIds() {
    const oThis = this,
      loggedOutFeedCacheResp = await new LoggedOutFeedCache({
        limit: oThis.limit,
        paginationTimestamp: oThis.paginationTimestamp
      }).fetch();

    oThis.feedIds = loggedOutFeedCacheResp.data.feedIds;
    oThis.feedsMap = loggedOutFeedCacheResp.data.feedDetails;

    const lastFeedId = oThis.feedIds[oThis.feedIds.length - 1];
    console.log('------lastFeedId------', oThis.feedIds, oThis.feedIds.length, lastFeedId);
    oThis.nextPaginationTimestamp = oThis.feedsMap[lastFeedId].paginationIdentifier;
  }

  /**
   * Prepare Response
   *
   * @returns {*|result}
   * @private
   */
  _prepareResponse() {
    const oThis = this;

    const nextPagePayloadKey = {};

    if (oThis.feeds.length >= oThis.limit) {
      nextPagePayloadKey[paginationConstants.paginationIdentifierKey] = {
        // TODO - think on how to remove duplicates.
        pagination_timestamp: oThis.nextPaginationTimestamp
      };
    }

    const responseMetaData = {
      [paginationConstants.nextPagePayloadKey]: nextPagePayloadKey
    };

    return responseHelper.successWithData({
      feedList: oThis.feeds,
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
      currentUserUserContributionsMap: oThis.profileResponse.currentUserUserContributionsMap,
      currentUserVideoContributionsMap: oThis.profileResponse.currentUserVideoContributionsMap,
      pricePointsMap: oThis.profileResponse.pricePointsMap,
      meta: responseMetaData
    });
  }

  _currentPageLimit() {
    return paginationConstants.defaultPublicFeedPageSize;
  }

  /**
   * Default page limit.
   *
   * @private
   */
  _defaultPageLimit() {
    return paginationConstants.defaultPublicFeedPageSize;
  }

  _minPageLimit() {
    return paginationConstants.minPublicFeedPageSize;
  }

  _maxPageLimit() {
    return paginationConstants.maxPublicFeedPageSize;
  }
}

module.exports = PublicVideoFeed;
