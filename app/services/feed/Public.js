const rootPrefix = '../../..',
  FeedBase = require(rootPrefix + '/app/services/feed/Base'),
  FeedModel = require(rootPrefix + '/app/models/mysql/Feed'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  LoggedOutFeedCache = require(rootPrefix + '/lib/cacheManagement/single/LoggedOutFeed'),
  FeedByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/FeedByIds'),
  PersonalizedFeedByUserIdCache = require(rootPrefix + '/lib/cacheManagement/single/PersonalizedFeedByUserId'),
  UserNotificationVisitDetailModel = require(rootPrefix + '/app/models/cassandra/UserNotificationVisitDetail'),
  SortUnseenFeedLib = require(rootPrefix + '/lib/feed/SortUnseen'),
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

    oThis.userFeedIdsCacheData = null;
    oThis.currentFeedIds = [];
    oThis.setCacheData = false;
    oThis.latestSeenFeedTime = 0;
    oThis.unseenFeedMap = {};
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

    return oThis.currentUserId;
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
  async fetchFeedIdsForUser() {
    const oThis = this;

    const queryParams = {
      limit: feedConstants.personalizedFeedMaxIdsCount
    };

    let previousFeedIds = oThis.userFeedIdsCacheData['unseenFeedIds'].slice();

    let cacheCount = previousFeedIds.length;
    const newCacheData = { seenFeedIds: [], unseenFeedIds: [] };

    const queryResp = await new FeedModel().getLatestFeedIds(queryParams);

    console.log(
      `PERSONALIZED FEED:${oThis.currentUserId} oThis.lastVisitedAt ================================`,
      oThis.lastVisitedAt
    );
    console.log(
      `PERSONALIZED FEED:${oThis.currentUserId} Seen Video Time min val================================`,
      Date.now() / 1000 - feedConstants.personalizedFeedSeenVideosAgeInSeconds
    );

    console.log(`PERSONALIZED FEED:${oThis.currentUserId} queryResp================================`, queryResp);

    let canBreak = false;

    for (let i = 0; i < queryResp['feedIds'].length; i++) {
      const feedId = queryResp['feedIds'][i];

      const feedObj = queryResp['feedsMap'][feedId],
        paginationIdentifier = feedObj.paginationIdentifier;

      console.log(
        `PERSONALIZED FEED:${
          oThis.currentUserId
        } Loop Iteration: ${i}, feedId: ${feedId} ,paginationIdentifier: ${paginationIdentifier} `
      );

      if (i === 0 && paginationIdentifier > oThis.lastVisitedAt) {
        oThis.latestSeenFeedTime = paginationIdentifier * 1000;
      }

      if (
        paginationIdentifier <= oThis.lastVisitedAt &&
        (cacheCount >= feedConstants.personalizedFeedMaxIdsCount ||
          (cacheCount >= feedConstants.personalizedFeedMinIdsCount &&
            paginationIdentifier < Date.now() / 1000 - feedConstants.personalizedFeedSeenVideosAgeInSeconds))
      ) {
        console.log(`PERSONALIZED FEED:${oThis.currentUserId} Break from loop set`);
        canBreak = true;
      }

      let index = previousFeedIds.indexOf(feedId);

      if (index > -1) {
        previousFeedIds.splice(index, 1);
        console.log(`PERSONALIZED FEED:${oThis.currentUserId} remove from previous feeds previousFeedIds`);
        newCacheData['unseenFeedIds'].push(feedId);
        oThis.unseenFeedMap[feedId] = feedObj;
        continue;
      } else {
        if (canBreak) {
          break;
        }
      }

      if (oThis.lastVisitedAt < paginationIdentifier) {
        newCacheData['unseenFeedIds'].push(feedId);
        oThis.unseenFeedMap[feedId] = feedObj;
      } else {
        newCacheData['seenFeedIds'].push(feedId);
      }
      cacheCount++;
    }

    console.log('\n\n\n==============================\n\n\n');
    console.log(`PERSONALIZED FEED:${oThis.currentUserId} oThis.newCacheData: ${JSON.stringify(newCacheData)}`);

    oThis.userFeedIdsCacheData['unseenFeedIds'] = newCacheData['unseenFeedIds'].concat(previousFeedIds);
    oThis.userFeedIdsCacheData['seenFeedIds'] = newCacheData['seenFeedIds'];

    oThis.userFeedIdsCacheData['recentSeenFeedIds'] = [];
    oThis.userFeedIdsCacheData['removedFeedIds'] = [];
    oThis.userFeedIdsCacheData['nextRenderIndex'] = 0;

    oThis.feedIdsLengthFromCache =
      oThis.userFeedIdsCacheData['unseenFeedIds'].length + oThis.userFeedIdsCacheData['seenFeedIds'].length;

    if (oThis.feedIdsLengthFromCache > feedConstants.personalizedFeedMaxIdsCount) {
      let extraUnseenIds = oThis.userFeedIdsCacheData['unseenFeedIds'].splice(
        feedConstants.personalizedFeedMaxIdsCount - 1
      );

      for (let feedId in extraUnseenIds) {
        let index = previousFeedIds.indexOf(feedId);
        if (index > -1) {
          previousFeedIds.splice(index, 1);
        }
      }

      let diff = feedConstants.personalizedFeedMaxIdsCount - oThis.userFeedIdsCacheData['unseenFeedIds'].length;
      oThis.userFeedIdsCacheData['seenFeedIds'] = oThis.userFeedIdsCacheData['seenFeedIds'].splice(0, diff);
      oThis.feedIdsLengthFromCache = feedConstants.personalizedFeedMaxIdsCount;
    }

    if (previousFeedIds.length > 0) {
      const feedByIdsCacheResponse = await new FeedByIdsCache({ ids: previousFeedIds }).fetch();

      if (feedByIdsCacheResponse.isFailure()) {
        return Promise.reject(feedByIdsCacheResponse);
      }

      Object.assign(oThis.unseenFeedMap, feedByIdsCacheResponse.data);
    }

    if (oThis.userFeedIdsCacheData['unseenFeedIds'].length > 0) {
      let sortParams = {
        currentUserId: oThis.currentUserId,
        unseenFeedIds: oThis.userFeedIdsCacheData['unseenFeedIds'].slice(),
        feedsMap: oThis.unseenFeedMap
      };

      const sortResponse = await new SortUnseenFeedLib(sortParams).perform();

      if (sortResponse.isFailure()) {
        return Promise.reject(sortResponse);
      }

      for (let feedId in oThis.userFeedIdsCacheData['unseenFeedIds']) {
        if (sortResponse.data['unseenFeedIds'].indexOf(feedId) === -1) {
          let index = previousFeedIds.indexOf(feedId);

          if (index === -1) {
            oThis.userFeedIdsCacheData['removedFeedIds'].push(feedId);
          } else {
            previousFeedIds.splice(index, 1);
          }
        }
      }

      oThis.userFeedIdsCacheData['unseenFeedIds'] = sortResponse.data['unseenFeedIds'];
      console.log(
        `PERSONALIZED FEED:${oThis.currentUserId} sorted unseenFeedIds: ${JSON.stringify(
          oThis.userFeedIdsCacheData['unseenFeedIds']
        )}`
      );
    }

    oThis.feedIdsLengthFromCache =
      oThis.userFeedIdsCacheData['unseenFeedIds'].length +
      oThis.userFeedIdsCacheData['seenFeedIds'].length +
      oThis.userFeedIdsCacheData['removedFeedIds'].length;

    oThis.userFeedIdsCacheData['previousFeedIds'] = previousFeedIds;
    console.log(
      `PERSONALIZED FEED:${oThis.currentUserId} BEFORE SHUFFLE oThis.userFeedIdsCacheData.seenFeedIds=========`,
      oThis.userFeedIdsCacheData['seenFeedIds']
    );

    oThis.userFeedIdsCacheData['seenFeedIds'] = basicHelper.shuffleArray(oThis.userFeedIdsCacheData['seenFeedIds']);

    console.log(
      `PERSONALIZED FEED:${oThis.currentUserId} DATA FOR oThis.userFeedIdsCacheData=========`,
      oThis.userFeedIdsCacheData
    );
  }

  /**
   * Set feed ids for first page of logged in user.
   *
   * @returns {Promise<*>}
   * @private
   */
  async fetchFeedIdsForFirstPage(getUserFeedIdsFromCache) {
    const oThis = this;

    await oThis.getLastVisitTime();

    if (getUserFeedIdsFromCache) {
      await oThis.fetchFeedIdsForUserFromCache();
    }

    await oThis.fetchFeedIdsForUser();

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
      latestSeenFeedTime: oThis.latestSeenFeedTime
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
  async fetchFeedIdsForUserFromCache() {
    const oThis = this;

    const cacheResp = await new PersonalizedFeedByUserIdCache({ userId: oThis.currentUserId }).fetch();

    if (cacheResp.isFailure()) {
      return Promise.reject(cacheResp);
    }

    if (CommonValidators.validateNonEmptyObject(cacheResp.data)) {
      oThis.userFeedIdsCacheData = cacheResp.data;

      oThis.feedIdsLengthFromCache =
        oThis.userFeedIdsCacheData['seenFeedIds'].length +
        oThis.userFeedIdsCacheData['unseenFeedIds'].length +
        oThis.userFeedIdsCacheData['recentSeenFeedIds'].length +
        oThis.userFeedIdsCacheData['removedFeedIds'].length;
    } else {
      oThis.userFeedIdsCacheData = {
        seenFeedIds: [],
        unseenFeedIds: [],
        recentSeenFeedIds: [],
        removedFeedIds: [],
        previousFeedIds: [],
        nextRenderIndex: 0
      };
      oThis.feedIdsLengthFromCache = 0;
    }
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

    if (oThis.feedIdsLengthFromCache > (oThis.pageNumber - 1) * oThis.limit) {
      const nextRenderIndex = oThis.userFeedIdsCacheData['nextRenderIndex'] || 0;
      console.log(
        `PERSONALIZED FEED:${oThis.currentUserId} =====current nextRenderIndex:${nextRenderIndex}================`
      );

      let unseenIdsLength = oThis.userFeedIdsCacheData['unseenFeedIds'].length;

      if (unseenIdsLength > nextRenderIndex) {
        oThis.currentFeedIds = oThis.userFeedIdsCacheData['unseenFeedIds'].slice(
          nextRenderIndex,
          nextRenderIndex + oThis.limit
        );
        let unseenLength = oThis.currentFeedIds.length;
        let diff = oThis.limit - unseenLength;

        if (diff > 0) {
          let ids = oThis.userFeedIdsCacheData['seenFeedIds'].slice(0, diff);
          oThis.currentFeedIds = oThis.currentFeedIds.concat(ids);
        }
      } else {
        let seenIndex = nextRenderIndex - unseenIdsLength;
        oThis.currentFeedIds = oThis.userFeedIdsCacheData['seenFeedIds'].slice(seenIndex, seenIndex + oThis.limit);
      }

      oThis.userFeedIdsCacheData['nextRenderIndex'] += oThis.currentFeedIds.length;

      const feedByIdsCacheResponse = await new FeedByIdsCache({ ids: oThis.currentFeedIds }).fetch();

      if (feedByIdsCacheResponse.isFailure()) {
        return Promise.reject(feedByIdsCacheResponse);
      }

      oThis.feedsMap = feedByIdsCacheResponse.data;
      oThis.feedIds = oThis.currentFeedIds;

      console.log(
        `PERSONALIZED FEED:${oThis.currentUserId} oThis.currentFeedIds==============================oThis.limit======`,
        oThis.currentFeedIds,
        oThis.limit
      );

      //If From Cache always increment page no
      oThis.nextPageNumber = oThis.pageNumber + 1;
      oThis.setCacheData = true;
    } else {
      let roundedLimitCount = oThis.limit - (oThis.feedIdsLengthFromCache % oThis.limit);
      roundedLimitCount = roundedLimitCount == oThis.limit ? 0 : roundedLimitCount;

      const previousFeedLength = oThis.userFeedIdsCacheData['previousFeedIds'].length;
      let offset = (oThis.pageNumber - 1) * oThis.limit - previousFeedLength - roundedLimitCount;

      console.log(
        `PERSONALIZED FEED:${
          oThis.currentUserId
        } GET DATA FROM DB previousFeedLength,offset================================`,
        previousFeedLength,
        offset
      );

      const queryParams = {
        limit: oThis.limit,
        offset: offset,
        previousFeedIds: oThis.userFeedIdsCacheData['previousFeedIds']
      };

      const queryResp = await new FeedModel().getPersonalizedFeedIdsAfterCache(queryParams);

      oThis.feedsMap = queryResp.feedsMap;
      oThis.feedIds = queryResp.feedIds;

      if (oThis.feedIds.length >= oThis.limit) {
        oThis.nextPageNumber = oThis.pageNumber + 1;
      }
    }

    console.log(
      `PERSONALIZED FEED:${oThis.currentUserId} oThis.nextPageNumber================================`,
      oThis.nextPageNumber
    );
    return responseHelper.successWithData({});
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
   * Get User feed ids for unseen and seen from cache.
   *
   * @sets oThis.userFeedIdsCacheData
   *
   * @returns {Promise<*>}
   * @private
   */
  async setFeedIdsForUserInCache() {
    const oThis = this;

    let activeFeedIds = [];

    for (let i = 0; i < oThis.feeds.length; i++) {
      activeFeedIds.push(oThis.feeds[i].id);
    }

    for (let i = 0; i < oThis.currentFeedIds.length; i++) {
      const feedId = oThis.currentFeedIds[i];

      const index = activeFeedIds.indexOf(feedId);
      if (index === -1) {
        oThis.userFeedIdsCacheData['removedFeedIds'].push(feedId);
        oThis.userFeedIdsCacheData['nextRenderIndex'] -= 1;

        const unseenIndex = oThis.userFeedIdsCacheData['unseenFeedIds'].indexOf(feedId);
        if (unseenIndex > -1) {
          oThis.userFeedIdsCacheData['unseenFeedIds'].splice(unseenIndex, 1);
        } else {
          const seenIndex = oThis.userFeedIdsCacheData['seenFeedIds'].indexOf(feedId);
          if (seenIndex > -1) {
            oThis.userFeedIdsCacheData['seenFeedIds'].splice(seenIndex, 1);
          } else {
            throw new Error(`INVALID FEED DATA--userId:${oThis.currentUserId}====feedId:${feedId}`);
          }
        }
      }
    }

    const cacheResp = await new PersonalizedFeedByUserIdCache({ userId: oThis.currentUserId }).setCacheData(
      oThis.userFeedIdsCacheData
    );

    if (cacheResp.isFailure()) {
      return Promise.reject(cacheResp);
    }

    if (oThis.latestSeenFeedTime) {
      await oThis.updateFeedLastVisitTime();
    }

    return responseHelper.successWithData({});
  }

  /**
   * Prepare response.
   *
   * @sets oThis.feeds, oThis.profileResponse
   *
   * @returns {*|result}
   * @private
   */
  async _prepareResponse() {
    const oThis = this;

    const nextPagePayloadKey = {};

    if (oThis.setCacheData) {
      await oThis.setFeedIdsForUserInCache();
    }

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
