const rootPrefix = '../../..',
  FeedBase = require(rootPrefix + '/app/services/feed/Base'),
  FeedModel = require(rootPrefix + '/app/models/mysql/Feed'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  LoggedOutFeedCache = require(rootPrefix + '/lib/cacheManagement/single/LoggedOutFeed'),
  FeedByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/FeedByIds'),
  UserBlockedListCache = require(rootPrefix + '/lib/cacheManagement/single/UserBlockedList'),
  UserVideoViewModel = require(rootPrefix + '/app/models/cassandra/UserVideoView'),
  UserPersonalizedDataModel = require(rootPrefix + '/app/models/cassandra/UserPersonalizedData'),
  SortUnseenFeedLib = require(rootPrefix + '/lib/feed/SortUnseen'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  feedConstants = require(rootPrefix + '/lib/globalConstant/feed'),
  userPersonalizedDataConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userPersonalizedData'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
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
    oThis.headers = params.sanitized_headers;

    oThis.limit = oThis._defaultPageLimit();
    oThis.paginationTimestamp = null;
    oThis.nextPaginationTimestamp = null;
    oThis.pageNumber = null;
    oThis.nextPageNumber = null;

    oThis.userPersonalizedfeedData = null;
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
      logger.log(`===================PERSONALIZED FEED${oThis.currentUserId} Page Number:`, oThis.pageNumber);
    } else {
      oThis.paginationTimestamp = null;
      oThis.pageNumber = 1;
    }

    // Validate limit.
    return oThis._validatePageSize();
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

    // if logged in feed, then show shuffled feeds
    if (oThis._showShuffledFeeds()) {
      if (oThis.pageNumber > 1) {
        await oThis.fetchPersonalizedFeedDataforUser();

        if (!oThis.userPersonalizedfeedData) {
          oThis.pageNumber = 1;
          await oThis.fetchFeedIdsForFirstPage();
        }
      } else {
        await oThis.fetchFeedIdsForFirstPage();
      }

      await oThis._setFeedDataForLoggedInUser();
    } else {
      await oThis._setFeedDataForLoggedOutUser();
    }

    await oThis._filterFeedData();
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
   * Get User feed ids for unseen and seen from cassandra.
   *
   * @sets oThis.userPersonalizedfeedData
   *
   * @returns {Promise<*>}
   * @private
   */
  async fetchPersonalizedFeedDataforUser() {
    const oThis = this;

    const dbRow = await new UserPersonalizedDataModel().fetchJsonDataForKind({
      userId: oThis.currentUserId,
      kind: userPersonalizedDataConstants.feedDataKind,
      uniqueId: oThis._pepodeviceId()
    });

    if (CommonValidators.validateNonEmptyObject(dbRow.jsonData)) {
      oThis.userPersonalizedfeedData = dbRow.jsonData;
    }

    // logger.log(
    //   `===================PERSONALIZED FEED:${oThis.currentUserId} Fetch Personalize Feed Data:`,
    //   oThis.userPersonalizedfeedData
    // );
  }

  /**
   * Set feed ids for first page of logged in user.
   *
   * @returns {Promise<*>}
   * @private
   */
  async fetchFeedIdsForFirstPage() {
    const oThis = this;

    let lastPaginationTimestamp = 0;

    const newPersonalizeData = {
      unseenFeedIds: [],
      shuffledSeenFeedIds: [],
      seenFeedIds: []
    };

    let cacheResp = await new UserBlockedListCache({ userId: oThis.currentUserId }).fetch();
    if (cacheResp.isFailure()) {
      return Promise.reject(cacheResp);
    }

    let blockedByUserInfo = cacheResp.data[oThis.currentUserId];

    logger.log(`===================PERSONALIZED FEED:${oThis.currentUserId} blockedByUserInfo === `, blockedByUserInfo);

    const queryParams = {
      limit: feedConstants.personalizedFeedMaxIdsCount
    };

    // fetch latest feeds
    const feedQueryResp = await new FeedModel().getLatestFeedIds(queryParams);

    const allVideoIds = [];

    let totalFeeds = feedQueryResp['feedIds'].length;

    // collect non blocked video ids
    for (let i = 0; i < totalFeeds; i++) {
      const feedId = feedQueryResp['feedIds'][i];
      const feedObj = feedQueryResp['feedsMap'][feedId];
      const actorId = feedObj.actor;

      lastPaginationTimestamp = feedObj.paginationIdentifier;
      if (!blockedByUserInfo.hasBlocked[actorId] && !blockedByUserInfo.blockedBy[actorId]) {
        allVideoIds.push(Number(feedObj.primaryExternalEntityId));
      }
    }

    logger.log(
      `===================PERSONALIZED FEED:${oThis.currentUserId} all valid videoIds === `,
      allVideoIds.length
    );

    let allActorIds = [];

    if (allVideoIds.length > 0) {
      const videoIdToUserVideoViewMap = await new UserVideoViewModel().fetchVideoViewDetails({
        userId: oThis.currentUserId,
        videoIds: allVideoIds
      });

      for (let i = 0; i < feedQueryResp['feedIds'].length; i++) {
        const feedId = feedQueryResp['feedIds'][i];
        const feedObj = feedQueryResp['feedsMap'][feedId];
        const paginationIdentifier = feedObj.paginationIdentifier;
        const userVideoViewObj = videoIdToUserVideoViewMap[Number(feedObj.primaryExternalEntityId)];
        const actorId = feedObj.actor;

        // skip the feeds due to videos from blocked users
        if (blockedByUserInfo.hasBlocked[actorId] || blockedByUserInfo.blockedBy[actorId]) {
          logger.log(
            `====PERSONALIZED FEED:${oThis.currentUserId} blocked video === `,
            feedObj.primaryExternalEntityId
          );
          continue;
        }

        allActorIds.push(actorId);
        // if seen
        if (userVideoViewObj && userVideoViewObj.lastViewAt) {
          let wasSeenRecently =
            paginationIdentifier >= Date.now() / 1000 - feedConstants.personalizedFeedSeenVideosAgeInSeconds;

          if (wasSeenRecently) {
            newPersonalizeData['shuffledSeenFeedIds'].push(feedId);
          } else {
            newPersonalizeData['seenFeedIds'].push(feedId);
          }
        } else {
          newPersonalizeData['unseenFeedIds'].push(feedId);
        }
      }
    }

    let sortParams = {
      allActorIds: allActorIds,
      sortFeeds: !oThis._isOlderBuildWithoutVideoPlayEvent(),
      currentUserId: oThis.currentUserId,
      unseenFeedIds: newPersonalizeData['unseenFeedIds'].slice(),
      seenFeedIds: newPersonalizeData['seenFeedIds'].slice(),
      shuffledSeenFeedIds: newPersonalizeData['shuffledSeenFeedIds'].slice(),
      feedsMap: feedQueryResp['feedsMap']
    };

    // logger.log(`===================PERSONALIZED FEED:${oThis.currentUserId} sortParams === `, sortParams);
    const sortResponse = await new SortUnseenFeedLib(sortParams).perform();

    if (sortResponse.isFailure()) {
      return Promise.reject(sortResponse);
    }

    newPersonalizeData['unseenFeedIds'] = sortResponse.data['unseenFeedIds'];
    newPersonalizeData['seenFeedIds'] = sortResponse.data['seenFeedIds'];
    newPersonalizeData['shuffledSeenFeedIds'] = sortResponse.data['shuffledSeenFeedIds'];

    // logger.log(
    //   `===================PERSONALIZED FEED:${oThis.currentUserId} newPersonalizeData before shuffle=== `,
    //   newPersonalizeData
    // );

    newPersonalizeData['shuffledSeenFeedIds'] = basicHelper.shuffleArray(newPersonalizeData['shuffledSeenFeedIds']);

    let allSortedFeedIds = newPersonalizeData['unseenFeedIds'].concat(newPersonalizeData['shuffledSeenFeedIds']);
    allSortedFeedIds = allSortedFeedIds.concat(newPersonalizeData['seenFeedIds']);

    oThis.userPersonalizedfeedData = {
      allSortedFeedIds: allSortedFeedIds,
      lastPaginationTimestamp: lastPaginationTimestamp
    };

    await new UserPersonalizedDataModel().updateJsonDataForUsers({
      userId: oThis.currentUserId,
      kind: userPersonalizedDataConstants.feedDataKind,
      uniqueId: oThis._pepodeviceId(),
      jsonData: oThis.userPersonalizedfeedData
    });
  }

  /**
   * Returns unique Identifier of device for currennt request
   *
   * @returns {String}
   * @private
   */
  _pepodeviceId() {
    const oThis = this;
    logger.log(
      `===================PERSONALIZED FEED${oThis.currentUserId} x-pepo-device-id:`,
      oThis.headers['x-pepo-device-id']
    );

    return oThis.headers['x-pepo-device-id'] || '';
  }

  /**
   * Returns true if older pepo builds which does not have video play event
   *
   * @returns {Boolean}
   * @private
   */
  _isOlderBuildWithoutVideoPlayEvent() {
    const oThis = this;
    const appVersion = oThis.headers['x-pepo-app-version'] || '';

    let res = false;

    if (['0.9.0', '0.9.1'].indexOf(appVersion) > -1) {
      res = true;
    }

    logger.log(`===================PERSONALIZED FEED${oThis.currentUserId}=======x-pepo-app-version==`, appVersion);

    return res;
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
   * Set feed data for logged in users.
   *
   * @sets oThis.feedIds, oThis.feedsMap
   *
   * @returns {Promise<*>}
   * @private
   */
  async _setFeedDataForLoggedInUser() {
    const oThis = this;

    const allSortedFeedIds = oThis.userPersonalizedfeedData.allSortedFeedIds;

    const renderStartIndex = (oThis.pageNumber - 1) * oThis.limit;

    if (allSortedFeedIds.length > renderStartIndex) {
      oThis.feedIds = allSortedFeedIds.slice(renderStartIndex, renderStartIndex + oThis.limit);

      const feedByIdsCacheResponse = await new FeedByIdsCache({ ids: oThis.feedIds }).fetch();

      if (feedByIdsCacheResponse.isFailure()) {
        return Promise.reject(feedByIdsCacheResponse);
      }

      oThis.feedsMap = feedByIdsCacheResponse.data;

      oThis.nextPageNumber = oThis.pageNumber + 1;
    } else {
      logger.log(`===================PERSONALIZED FEED:${oThis.currentUserId} Fetching From DB`);
      let pagesFromCache = Math.ceil(allSortedFeedIds.length / oThis.limit);
      let offset = (oThis.pageNumber - 1 - pagesFromCache) * oThis.limit;

      const queryParams = {
        limit: oThis.limit,
        offset: offset,
        paginationTimestamp: oThis.userPersonalizedfeedData.lastPaginationTimestamp
      };

      const queryResp = await new FeedModel().getPersonalizedFeedIdsAfterTimestamp(queryParams);

      oThis.feedsMap = queryResp.feedsMap;
      oThis.feedIds = queryResp.feedIds;

      if (oThis.feedIds.length >= oThis.limit) {
        oThis.nextPageNumber = oThis.pageNumber + 1;
      }
    }
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
