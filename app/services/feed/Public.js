const rootPrefix = '../../..',
  FeedBase = require(rootPrefix + '/app/services/feed/Base'),
  FeedModel = require(rootPrefix + '/app/models/mysql/Feed'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  LoggedOutFeedCache = require(rootPrefix + '/lib/cacheManagement/single/LoggedOutFeed'),
  FeedByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/FeedByIds'),
  PersonalizedFeedByUserIdCache = require(rootPrefix + '/lib/cacheManagement/single/PersonalizedFeedByUserId'),
  UserNotificationVisitDetailModel = require(rootPrefix + '/app/models/cassandra/UserNotificationVisitDetail'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  feedConstants = require(rootPrefix + '/lib/globalConstant/feed'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination');

/**
 * Class for public video feed.
 *
 * @class PublicVideoFeed
 */
class PublicVideoFeed extends FeedBase {
  /**
   * Constructor for public video feed.
   *
   * @param {object} params
   * @param {object} params.current_user
   * @param {string} [params.pagination_identifier]
   *
   * @augments FeedBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.paginationIdentifier = params[paginationConstants.paginationIdentifierKey] || null;

    oThis.limit = oThis._defaultPageLimit();
    oThis.paginationTimestamp = null;
    oThis.nextPaginationTimestamp = null;
    oThis.pageNumber = null;
    oThis.nextPageNumber = null;

    oThis.feedIdsLengthFromCache = 0;
    oThis.lastVisitedAt = 0;
    oThis.newFeedIds = [];
    oThis.olderFeedIds = [];

    oThis.userFeedIdsCacheData = null;
  }

  /**
   * Validate and sanitize.
   *
   * @sets oThis.currentUserId, oThis.paginationTimestamp
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
      oThis.pageNumber = Number(parsedPaginationParams.page_no) || 1; // Override paginationTimestamp number.
    } else {
      oThis.paginationTimestamp = null;
      oThis.pageNumber = 1;
    }

    // Validate limit.
    return oThis._validatePageSize();
  }

  /**
   * Whether to shuffle feeds.
   *
   * @returns {Boolean}
   * @private
   */
  _showShuffledFeeds() {
    const oThis = this;

    return (
      oThis.currentUserId &&
      (basicHelper.isDevelopment() ||
        (basicHelper.isStaging() && [1754, 1603, 1009].indexOf(oThis.currentUserId) > -1) ||
        (basicHelper.isSandbox() && [oThis.currentUserId].indexOf(oThis.currentUserId) > -1) ||
        (basicHelper.isProduction() && [23, 56, 7, 12, 4].indexOf(oThis.currentUserId) > -1))
    );
  }

  /**
   * Set feed ids.
   *
   * @sets oThis.feedIds, oThis.feedsMap, oThis.nextPaginationTimestamp
   *
   * @returns {Promise<*>}
   * @private
   */
  async _setFeedIds() {
    const oThis = this;

    if (oThis._showShuffledFeeds()) {
      console.log(
        `PERSONALIZED FEED:${oThis.currentUserId} oThis.pageNumber================================`,
        oThis.pageNumber
      );
      if (oThis.pageNumber > 1) {
        await oThis.fetchFeedIdsForUserFromCache();

        if (oThis.feedIdsLengthFromCache === 0) {
          oThis.pageNumber = 1;
          await oThis.fetchFeedIdsForFirstPage(false);
        }
      } else {
        await oThis.fetchFeedIdsForFirstPage(true);
      }

      await oThis._setFeedDataForLoggedInUser();
    } else {
      await oThis._setFeedDataForLoggedOutUser();
    }

    await oThis._filterFeedData();
  }

  /**
   * Set feed ids for first page of logged in user.
   *
   * @returns {Promise<*>}
   * @private
   */
  async fetchFeedIdsForFirstPage(getUserFeedIdsFromCache) {
    const oThis = this;

    let promises = [];

    await oThis.getLastVisitTime();
    promises.push(oThis.fetchNewFeedIds());

    if (getUserFeedIdsFromCache) {
      promises.push(oThis.fetchFeedIdsForUserFromCache());
    }

    await Promise.all(promises);

    if (oThis.newFeedIds.length > 0) {
      oThis.userFeedIdsCacheData['unseenFeedIds'] = oThis.newFeedIds.concat(
        oThis.userFeedIdsCacheData['unseenFeedIds']
      );

      oThis.userFeedIdsCacheData['unseenFeedIds'] = [...new Set(oThis.userFeedIdsCacheData['unseenFeedIds'])];
      oThis.userFeedIdsCacheData['unseenFeedIds'] = oThis.userFeedIdsCacheData['unseenFeedIds'].splice(
        0,
        feedConstants.personalizedFeedMaxIdsCount
      );
    }

    if (oThis.newFeedIds.length > 0 || oThis.userFeedIdsCacheData['seenFeedIds'].length === 0) {
      await oThis.fetchOlderFeedIds();
      oThis.userFeedIdsCacheData['seenFeedIds'] = oThis.olderFeedIds;
    }

    oThis.userFeedIdsCacheData['seenFeedIds'] = basicHelper.shuffleArray(oThis.userFeedIdsCacheData['seenFeedIds']);

    oThis.feedIdsLengthFromCache =
      oThis.userFeedIdsCacheData['seenFeedIds'].length + oThis.userFeedIdsCacheData['unseenFeedIds'].length;

    return responseHelper.successWithData({});
  }

  /**
   * Set older feed ids before last visit time.
   *
   * @sets oThis.olderFeedIds
   *
   * @returns {Promise<*>}
   * @private
   */
  async fetchOlderFeedIds() {
    const oThis = this,
      limit = feedConstants.personalizedFeedMaxIdsCount - oThis.userFeedIdsCacheData['unseenFeedIds'].length;

    if (limit <= 0) {
      return responseHelper.successWithData({});
    }

    const queryParams = {
      feedIds: oThis.userFeedIdsCacheData['unseenFeedIds'],
      limit: limit
    };

    oThis.olderFeedIds = await new FeedModel().getOlderFeedIds(queryParams);
    console.log(
      `PERSONALIZED FEED:${oThis.currentUserId} oThis.olderFeedIds================================`,
      oThis.olderFeedIds
    );
    return responseHelper.successWithData({});
  }

  /**
   * Get feed last visit time of User.
   *
   * @sets oThis.lastVisitedAt
   *
   * @returns {Promise<*>}
   * @private
   */
  async getLastVisitTime() {
    const oThis = this;

    const queryParams = {
      userId: oThis.currentUserId
    };

    const userNotificationVisitDetailsResp = await new UserNotificationVisitDetailModel().fetchLatestSeenFeedTime(
      queryParams
    );

    oThis.lastVisitedAt = Math.round((userNotificationVisitDetailsResp.latestSeenFeedTime || 0) / 1000);

    return responseHelper.successWithData({});
  }

  /**
   * Set feed last visit time of User.
   *
   * @sets oThis.lastVisitedAt
   *
   * @returns {Promise<*>}
   * @private
   */
  async updateFeedLastVisitTime() {
    const oThis = this;

    const queryParams = {
      userId: oThis.currentUserId,
      latestSeenFeedTime: Date.now()
    };

    return new UserNotificationVisitDetailModel().updateLatestSeenFeedTime(queryParams);
  }

  /**
   * Get User feed ids for unseen and seen from cache.
   *
   * @sets oThis.userFeedIdsCacheData
   *
   * @returns {Promise<*>}
   * @private
   */
  async setFeedIdsForUserInCache() {
    const oThis = this;

    const cacheResp = await new PersonalizedFeedByUserIdCache({ userId: oThis.currentUserId }).setCacheData(
      oThis.userFeedIdsCacheData
    );

    if (cacheResp.isFailure()) {
      return Promise.reject(cacheResp);
    }

    return responseHelper.successWithData({});
  }

  /**
   * Get User feed ids for unseen and seen from cache.
   *
   * @sets oThis.userFeedIdsCacheData
   *
   * @returns {Promise<*>}
   * @private
   */
  async fetchFeedIdsForUserFromCache() {
    const oThis = this;

    const cacheResp = await new PersonalizedFeedByUserIdCache({ userId: oThis.currentUserId }).fetch();

    if (cacheResp.isFailure()) {
      return Promise.reject(cacheResp);
    }

    if (CommonValidators.validateNonEmptyObject(cacheResp.data)) {
      oThis.userFeedIdsCacheData = cacheResp.data;

      oThis.feedIdsLengthFromCache =
        oThis.userFeedIdsCacheData['seenFeedIds'].length + oThis.userFeedIdsCacheData['unseenFeedIds'].length;
    } else {
      oThis.userFeedIdsCacheData = { seenFeedIds: [], unseenFeedIds: [] };
      oThis.feedIdsLengthFromCache = 0;
    }
  }

  /**
   * Set new feed ids since last visit time.
   *
   * @sets oThis.newFeedIds
   *
   * @returns {Promise<*>}
   * @private
   */
  async fetchNewFeedIds() {
    const oThis = this;

    const queryParams = {
      lastVisitedAt: oThis.lastVisitedAt,
      limit: feedConstants.personalizedFeedMaxIdsCount
    };

    oThis.newFeedIds = await new FeedModel().getNewFeedIdsAfterTime(queryParams);
    console.log(
      `PERSONALIZED FEED:${oThis.currentUserId} oThis.newFeedIds================================`,
      oThis.newFeedIds
    );
    await oThis.updateFeedLastVisitTime();
  }

  /**
   * Set feed data for logged in users.
   *
   * @sets oThis.feedIds, oThis.feedsMap, oThis.nextPaginationTimestamp
   *
   * @returns {Promise<*>}
   * @private
   */
  async _setFeedDataForLoggedInUser() {
    const oThis = this;

    let currentFeedIds = oThis.userFeedIdsCacheData['unseenFeedIds'].splice(0, oThis.limit);
    let unseenLength = currentFeedIds.length;

    if (unseenLength === 0 && oThis.feedIdsLengthFromCache <= (oThis.pageNumber - 1) * oThis.limit) {
      return responseHelper.successWithData({});
    }

    let diff = oThis.limit - unseenLength;

    if (diff > 0) {
      let ids = oThis.userFeedIdsCacheData['seenFeedIds'].splice(0, diff);
      currentFeedIds = currentFeedIds.concat(ids);
    }

    if (currentFeedIds.length > 0) {
      oThis.userFeedIdsCacheData['seenFeedIds'] = oThis.userFeedIdsCacheData['seenFeedIds'].concat(currentFeedIds);

      const feedByIdsCacheResponse = await new FeedByIdsCache({ ids: currentFeedIds }).fetch();

      if (feedByIdsCacheResponse.isFailure()) {
        return Promise.reject(feedByIdsCacheResponse);
      }

      oThis.feedsMap = feedByIdsCacheResponse.data;
      oThis.feedIds = currentFeedIds;
    } else {
      oThis.feedsMap = {};
      oThis.feedIds = [];
    }

    console.log(
      `PERSONALIZED FEED:${oThis.currentUserId} currentFeedIds==============================oThis.limit======`,
      currentFeedIds,
      oThis.limit
    );

    if (currentFeedIds.length >= oThis.limit) {
      oThis.nextPageNumber = oThis.pageNumber + 1;
    }

    console.log(
      `PERSONALIZED FEED:${oThis.currentUserId} oThis.nextPageNumber================================`,
      oThis.nextPageNumber
    );

    await oThis.setFeedIdsForUserInCache();
  }

  /**
   * Set feed ids.
   *
   * @sets oThis.feedIds, oThis.feedsMap, oThis.nextPaginationTimestamp
   *
   * @returns {Promise<*>}
   * @private
   */
  async _setFeedDataForLoggedOutUser() {
    const oThis = this;

    const loggedOutFeedCacheResp = await new LoggedOutFeedCache({
      limit: oThis.limit,
      paginationTimestamp: oThis.paginationTimestamp
    }).fetch();

    oThis.feedIds = loggedOutFeedCacheResp.data.feedIds;
    oThis.feedsMap = loggedOutFeedCacheResp.data.feedDetails;

    if (oThis.feedIds.length >= oThis.limit) {
      const lastFeedId = oThis.feedIds[oThis.feedIds.length - 1];
      oThis.nextPaginationTimestamp = oThis.feedsMap[lastFeedId].paginationIdentifier;
    }

    if (!oThis.currentUserId) {
      await oThis._handleCuratedFeeds();
    }
  }

  /**
   * Update feed ids.
   *
   * @sets oThis.feedIds, oThis.feedsMap
   *
   * @returns {Promise<*>}
   * @private
   */
  async _handleCuratedFeeds() {
    const oThis = this;

    let curatedFeedMap = {};
    const curatedFeedIdsString = coreConstants.PEPO_CURATED_FEED_IDS,
      curatedFeedIds = JSON.parse(curatedFeedIdsString);

    if (oThis.paginationTimestamp == null) {
      // Logged out mode and FIRST page.
      curatedFeedMap = await new FeedModel().fetchByIds(curatedFeedIds);

      oThis.feedsMap = Object.assign(oThis.feedsMap, curatedFeedMap);
      oThis.feedIds = curatedFeedIds.concat(oThis.feedIds);
    } else {
      // Logged out mode and NOT FIRST page.
      for (let index = 0; index < curatedFeedIds.length; index++) {
        const curatedFeedId = curatedFeedIds[index],
          arrayIndex = oThis.feedIds.indexOf(curatedFeedId);

        if (arrayIndex >= 0) {
          oThis.feedIds.splice(arrayIndex, 1);
          delete oThis.feedsMap[curatedFeedId];
        }
      }
    }
  }

  /**
   * Update feed ids to remove inactive feeds.
   *
   * @sets oThis.feedIds, oThis.feedsMap
   *
   * @returns {Promise<*>}
   * @private
   */
  async _filterFeedData() {
    const oThis = this;

    oThis.feedIds = [...new Set(oThis.feedIds)];

    const activeFeedIds = [];

    for (let i = 0; i < oThis.feedIds.length; i++) {
      const feedId = oThis.feedIds[i];
      if (CommonValidators.validateNonEmptyObject(oThis.feedsMap[feedId])) {
        activeFeedIds.push(feedId);
      } else {
        delete oThis.feedsMap[feedId];
      }
    }

    oThis.feedIds = activeFeedIds;
  }

  /**
   * Prepare response.
   *
   * @sets oThis.feeds, oThis.profileResponse
   *
   * @returns {*|result}
   * @private
   */
  _prepareResponse() {
    const oThis = this;

    const nextPagePayloadKey = {};

    if (oThis._showShuffledFeeds()) {
      if (oThis.nextPageNumber) {
        nextPagePayloadKey[paginationConstants.paginationIdentifierKey] = {
          page_no: oThis.nextPageNumber
        };
      }
    } else {
      if (oThis.nextPaginationTimestamp) {
        nextPagePayloadKey[paginationConstants.paginationIdentifierKey] = {
          pagination_timestamp: oThis.nextPaginationTimestamp
        };
      }
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
      videoDescriptionsMap: oThis.profileResponse.videoDescriptionMap,
      currentUserUserContributionsMap: oThis.profileResponse.currentUserUserContributionsMap,
      currentUserVideoContributionsMap: oThis.profileResponse.currentUserVideoContributionsMap,
      pricePointsMap: oThis.profileResponse.pricePointsMap,
      tokenDetails: oThis.tokenDetails,
      meta: responseMetaData
    });
  }

  /**
   * Returns current page limit.
   *
   * @returns {number}
   * @private
   */
  _currentPageLimit() {
    return paginationConstants.defaultFeedsListPageSize;
  }

  /**
   * Returns default page limit.
   *
   * @returns {number}
   * @private
   */
  _defaultPageLimit() {
    return paginationConstants.defaultFeedsListPageSize;
  }

  /**
   * Returns minimum page limit.
   *
   * @returns {number}
   * @private
   */
  _minPageLimit() {
    return paginationConstants.minFeedsListPageSize;
  }

  /**
   * Returns maximum page limit.
   *
   * @returns {number}
   * @private
   */
  _maxPageLimit() {
    return paginationConstants.maxFeedsListPageSize;
  }
}

module.exports = PublicVideoFeed;
