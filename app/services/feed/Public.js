const rootPrefix = '../../..',
  FeedBase = require(rootPrefix + '/app/services/feed/Base'),
  FeedModel = require(rootPrefix + '/app/models/mysql/Feed'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  GetListFeedLib = require(rootPrefix + '/lib/feed/GetList'),
  FeedByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/FeedByIds'),
  LoggedOutFeedCache = require(rootPrefix + '/lib/cacheManagement/single/LoggedOutFeed'),
  UserPersonalizedDataModel = require(rootPrefix + '/app/models/cassandra/UserPersonalizedData'),
  UserDeviceExtendedDetailModel = require(rootPrefix + '/app/models/mysql/UserDeviceExtendedDetail'),
  UserDeviceExtendedDetailsByDeviceIdsCache = require(rootPrefix +
    '/lib/cacheManagement/multi/UserDeviceExtendedDetailsByDeviceIds'),
  headerHelper = require(rootPrefix + '/helpers/header'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination'),
  userPersonalizedDataConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userPersonalizedData');

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
   * @param {object} params.sanitized_headers
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

    // If logged in feed, then show shuffled feeds
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
    } else if (oThis.nextPaginationTimestamp) {
      nextPagePayloadKey[paginationConstants.paginationIdentifierKey] = {
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
      videoDescriptionsMap: oThis.profileResponse.videoDescriptionMap,
      currentUserUserContributionsMap: oThis.profileResponse.currentUserUserContributionsMap,
      currentUserVideoContributionsMap: oThis.profileResponse.currentUserVideoContributionsMap,
      currentUserVideoRelationsMap: oThis.profileResponse.currentUserVideoRelationsMap,
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
      uniqueId: headerHelper.pepoDeviceId(oThis.headers)
    });

    if (CommonValidators.validateNonEmptyObject(dbRow.jsonData)) {
      oThis.userPersonalizedfeedData = dbRow.jsonData;
    }
  }

  /**
   * Set feed ids for first page of logged in user.
   *
   * @returns {Promise<*>}
   * @private
   */
  // eslint-disable-next-line max-lines-per-function
  async fetchFeedIdsForFirstPage() {
    const oThis = this;

    const getListParams = {
      currentUserId: oThis.currentUserId,
      headers: oThis.headers
    };

    const getListResponse = await new GetListFeedLib(getListParams).perform();

    if (getListResponse.isFailure()) {
      return Promise.reject(getListResponse);
    }

    oThis.userPersonalizedfeedData = getListResponse.data;

    await new UserPersonalizedDataModel().updateJsonDataForUsers({
      userId: oThis.currentUserId,
      kind: userPersonalizedDataConstants.feedDataKind,
      uniqueId: headerHelper.pepoDeviceId(oThis.headers),
      jsonData: oThis.userPersonalizedfeedData
    });
  }

  /**
   * Whether to shuffle feeds.
   *
   * @returns {boolean}
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
   * @returns {Promise<void>}
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
      const pagesFromCache = Math.ceil(allSortedFeedIds.length / oThis.limit);
      const offset = (oThis.pageNumber - 1 - pagesFromCache) * oThis.limit;

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
  }

  /**
   * Set feed ids.
   *
   * @sets oThis.feedIds, oThis.feedsMap, oThis.nextPaginationTimestamp
   *
   * @returns {Promise<void>}
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

    for (let index = 0; index < oThis.feedIds.length; index++) {
      const feedId = oThis.feedIds[index];
      if (CommonValidators.validateNonEmptyObject(oThis.feedsMap[feedId])) {
        activeFeedIds.push(feedId);
      } else {
        delete oThis.feedsMap[feedId];
      }
    }

    oThis.feedIds = activeFeedIds;
  }

  /**
   * Mark user device details. This method will work only for a logged in user.
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _markUserDeviceDetails() {
    const oThis = this;

    if (!oThis.currentUserId) {
      return;
    }

    const deviceId = headerHelper.pepoDeviceId(oThis.headers),
      currentBuildNumber = headerHelper.pepoBuildNumber(oThis.headers),
      appVersion = headerHelper.pepoAppVersion(oThis.headers),
      deviceOs = headerHelper.pepoDeviceOs(oThis.headers);

    if (!deviceId) {
      return;
    }

    const userDeviceExtCacheResp = await new UserDeviceExtendedDetailsByDeviceIdsCache({
      deviceIds: [deviceId]
    }).fetch();
    const userDeviceExt = userDeviceExtCacheResp.data[deviceId];

    const insertUpdateParams = {
      deviceId: deviceId,
      userId: oThis.currentUserId,
      buildNumber: currentBuildNumber,
      appVersion: appVersion,
      deviceOs: deviceOs
    };

    if (userDeviceExt[oThis.currentUserId]) {
      const existingBuildNumber = userDeviceExt[oThis.currentUserId].buildNumber;

      // Update existing entry if existingBuildNumber is null, or if currentBuildNumber > existingBuildNumber.
      if (!existingBuildNumber || +currentBuildNumber > +existingBuildNumber) {
        await new UserDeviceExtendedDetailModel().updateByDeviceIdAndUserId(insertUpdateParams);
      }
    } else {
      await new UserDeviceExtendedDetailModel().createNewEntry(insertUpdateParams);
    }
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
