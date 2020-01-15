const rootPrefix = '../../..',
  FeedBase = require(rootPrefix + '/app/services/feed/Base'),
  UserArangoModel = require(rootPrefix + '/app/models/arango/User'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  UserDeviceExtendedDetailModel = require(rootPrefix + '/app/models/mysql/UserDeviceExtendedDetail'),
  UserDeviceExtendedDetailsByDeviceIdsCache = require(rootPrefix +
    '/lib/cacheManagement/multi/UserDeviceExtendedDetailsByDeviceIds'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  headerHelper = require(rootPrefix + '/helpers/header'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  videoDetailsConstants = require(rootPrefix + '/lib/globalConstant/videoDetail'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination');

/**
 * Class for for you feed.
 *
 * @class ForYouFeedData
 */
class ForYouFeedData extends FeedBase {
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
    oThis.pageNumber = null;
    oThis.nextPageNumber = null;
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

    if (oThis.paginationIdentifier) {
      const parsedPaginationParams = oThis._parsePaginationParams(oThis.paginationIdentifier);

      oThis.pageNumber = Number(parsedPaginationParams.page_no) || 1; // Override page number.
    } else {
      oThis.pageNumber = 1;
    }

    // Validate limit.
    return oThis._validatePageSize();
  }

  /**
   * Set video ids.
   *
   * @returns {Promise<*>}
   * @private
   */
  async _setFeedIds() {
    const oThis = this;

    await oThis._fetchFeedDataForUser();
    await oThis._setFeedData();
  }

  /**
   * Filter muted feeds.
   *
   * @return {Promise<void>}
   * @private
   */
  async _filterMutedFeeds() {
    const oThis = this;
    return;
  }

  /**
   * Set feed ids.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _setFeedData() {
    const oThis = this;

    if (oThis.videoIds.length < 1) {
      return;
    }
    const videoDetailsCacheResponse = await new VideoDetailsByVideoIdsCache({ videoIds: oThis.videoIds }).fetch();

    if (videoDetailsCacheResponse.isFailure()) {
      return Promise.reject(videoDetailsCacheResponse);
    }

    for (let vid in videoDetailsCacheResponse.data) {
      const videoDetail = videoDetailsCacheResponse.data[vid];
      if (videoDetail && videoDetail.status === videoDetailsConstants.activeStatus) {
        oThis.userIds.push(videoDetail.creatorUserId);
      }
    }
  }

  /**
   * Set video ids.
   *
   * @sets oThis.videoIds, oThis.nextPageNumber
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchFeedDataForUser() {
    const oThis = this;
    const queryParams = {
      userId: oThis.currentUserId,
      pageNumber: oThis.pageNumber,
      limit: oThis.limit
    };

    const res = await new UserArangoModel().getPosts(queryParams);
    oThis.videoIds = res.videoIds;

    if (oThis.videoIds.length >= oThis.limit) {
      oThis.nextPageNumber = oThis.pageNumber + 1;
    }
    oThis.videoIds = basicHelper.uniquate(oThis.videoIds);
  }

  /**
   * Filter out feeds of inactive users.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _filterInactiveUserFeeds() {
    const oThis = this;
    //todo: remove from base or change the logic to remove videos from deleted users
    //
    //   const tempFeeds = [];
    //   for (let index = 0; index < oThis.feeds.length; index++) {
    //     const feedData = oThis.feeds[index];
    //
    //     const profileObj = oThis.profileResponse.userProfilesMap[feedData.actor],
    //       videoEntityForFeed = oThis.profileResponse.videoMap[feedData.primaryExternalEntityId];
    //
    //     // Delete feeds whose user profile is not found.
    //     if (
    //       !CommonValidators.validateNonEmptyObject(profileObj) ||
    //       !CommonValidators.validateNonEmptyObject(videoEntityForFeed) ||
    //       videoEntityForFeed.status === videoConstants.deletedStatus
    //     ) {
    //       const errorObject = responseHelper.error({
    //         internal_error_identifier: 'a_s_f_fiuf_1',
    //         api_error_identifier: 'something_went_wrong',
    //         debug_options: { feedData: feedData, msg: 'FOUND DELETED VIDEO OR DELETED USERS VIDEO IN FEED' }
    //       });
    //
    //       if (
    //         CommonValidators.validateNonEmptyObject(videoEntityForFeed) &&
    //         videoEntityForFeed.status === videoConstants.deletedStatus
    //       ) {
    //         await createErrorLogsEntry.perform(errorObject, errorLogsConstants.mediumSeverity);
    //       }
    //     } else {
    //       tempFeeds.push(feedData);
    //     }
    //   }
    //   oThis.feeds = tempFeeds;
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

    if (oThis.nextPageNumber) {
      nextPagePayloadKey[paginationConstants.paginationIdentifierKey] = {
        page_no: oThis.nextPageNumber
      };
    }

    const responseMetaData = {
      [paginationConstants.nextPagePayloadKey]: nextPagePayloadKey
    };

    return responseHelper.successWithData({
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
   * Mark user device details. This method will work only for a logged in user.
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _markUserDeviceDetails() {
    const oThis = this;

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

module.exports = ForYouFeedData;
