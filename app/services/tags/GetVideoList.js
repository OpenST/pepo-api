const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  GetUserVideos = require(rootPrefix + '/lib/GetUsersVideoList'),
  GetTokenService = require(rootPrefix + '/app/services/token/Get'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  VideoTagsByTagIdPaginationCache = require(rootPrefix + '/lib/cacheManagement/single/VideoTagsByTagIdPagination'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination');

/**
 * Class for user video details service.
 *
 * @class GetTagsVideoList
 */
class GetTagsVideoList extends ServiceBase {
  /**
   * Constructor for user video details service.
   *
   * @param {object} params
   * @param {object} params.current_user
   * @param {number} params.tag_id
   * @param {string} [params.pagination_identifier]
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.currentUser = params.current_user;
    oThis.tagId = params.tag_id;
    oThis.paginationIdentifier = params[paginationConstants.paginationIdentifierKey] || null;

    oThis.limit = oThis._defaultPageLimit();

    oThis.paginationTimestamp = null;
    oThis.nextPaginationTimestamp = null;
    oThis.videosCount = 0;
    oThis.videoIds = [];
    oThis.videoDetails = [];
    oThis.tokenDetails = {};
  }

  /**
   * Async perform.
   *
   * @return {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    await oThis._fetchVideoIds();

    oThis._addResponseMetaData();

    const promisesArray = [];
    promisesArray.push(oThis._setTokenDetails());
    promisesArray.push(oThis._getVideos());
    await Promise.all(promisesArray);

    oThis._setUserVideoList();

    return oThis._prepareResponse();
  }

  /**
   * Validate and sanitize.
   *
   * @sets oThis.paginationTimestamp
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

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
   * Fetch video ids.
   *
   * @sets oThis.videosCount, oThis.videoIds, oThis.nextPaginationTimestamp
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchVideoIds() {
    const oThis = this;

    const cacheResponse = await new VideoTagsByTagIdPaginationCache({
      tagId: oThis.tagId,
      limit: oThis.limit,
      paginationTimestamp: oThis.paginationTimestamp
    }).fetch();

    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    const videoTagsDetails = cacheResponse.data;

    for (let ind = 0; ind < videoTagsDetails.length; ind++) {
      const videoTagsDetail = videoTagsDetails[ind];
      oThis.videosCount++;
      oThis.videoIds.push(videoTagsDetail.videoId);
      oThis.nextPaginationTimestamp = videoTagsDetail.createdAt;
    }

    return responseHelper.successWithData({});
  }

  /**
   * Add next page meta data.
   *
   * @sets oThis.responseMetaData
   *
   * @return {Result}
   * @private
   */
  _addResponseMetaData() {
    const oThis = this;

    const nextPagePayloadKey = {};

    if (oThis.videosCount >= oThis.limit) {
      nextPagePayloadKey[paginationConstants.paginationIdentifierKey] = {
        pagination_timestamp: oThis.nextPaginationTimestamp
      };
    }

    oThis.responseMetaData = {
      [paginationConstants.nextPagePayloadKey]: nextPagePayloadKey
    };

    return responseHelper.successWithData({});
  }

  /**
   * Fetch token details.
   *
   * @sets oThis.tokenDetails
   *
   * @return {Promise<result>}
   * @private
   */
  async _setTokenDetails() {
    const oThis = this;

    const tokenResp = await new GetTokenService().perform();
    if (tokenResp.isFailure()) {
      return Promise.reject(tokenResp);
    }

    oThis.tokenDetails = tokenResp.data.tokenDetails;

    return responseHelper.successWithData({});
  }

  /**
   * Get videos.
   *
   * @sets oThis.usersVideosMap
   *
   * @return {Promise<result>}
   * @private
   */
  async _getVideos() {
    const oThis = this;

    if (oThis.videoIds.length <= 0) {
      return responseHelper.successWithData({});
    }

    const userVideosObj = new GetUserVideos({
      currentUserId: oThis.currentUser.id,
      videoIds: oThis.videoIds,
      isAdmin: false
    });

    const response = await userVideosObj.perform();

    if (response.isFailure()) {
      return Promise.reject(response);
    }

    oThis.usersVideosMap = response.data;

    return responseHelper.successWithData({});
  }

  /**
   * Set user video list.
   *
   * @set oThis.videoDetails
   *
   * @returns {*|result}
   * @private
   */
  _setUserVideoList() {
    const oThis = this;

    for (let i = 0; i < oThis.videoIds.length; i++) {
      let videoId = oThis.videoIds[i];
      if (oThis.usersVideosMap.fullVideosMap[videoId]) {
        oThis.videoDetails.push(oThis.usersVideosMap.fullVideosMap[videoId]);
      }
    }
  }

  /**
   * Prepare final response.
   *
   *
   * @returns {*|result}
   * @private
   */
  _prepareResponse() {
    const oThis = this;

    return responseHelper.successWithData({
      [entityType.userVideoList]: oThis.videoDetails,
      [entityType.videoDetailsMap]: oThis.usersVideosMap.videoDetailsMap || {},
      [entityType.videoDescriptionsMap]: oThis.usersVideosMap.videoDescriptionMap || {},
      [entityType.userProfilesMap]: oThis.usersVideosMap.userProfilesMap || {},
      [entityType.currentUserUserContributionsMap]: oThis.usersVideosMap.currentUserUserContributionsMap || {},
      [entityType.currentUserVideoContributionsMap]: oThis.usersVideosMap.currentUserVideoContributionsMap || {},
      [entityType.userProfileAllowedActions]: oThis.usersVideosMap.userProfileAllowedActions || {},
      [entityType.pricePointsMap]: oThis.usersVideosMap.pricePointsMap || {},
      usersByIdMap: oThis.usersVideosMap.usersByIdMap || {},
      userStat: oThis.usersVideosMap.userStat || {},
      tags: oThis.usersVideosMap.tags || {},
      linkMap: oThis.usersVideosMap.linkMap || {},
      imageMap: oThis.usersVideosMap.imageMap || {},
      videoMap: oThis.usersVideosMap.videoMap || {},
      tokenUsersByUserIdMap: oThis.usersVideosMap.tokenUsersByUserIdMap || {},

      tokenDetails: oThis.tokenDetails,
      meta: oThis.responseMetaData
    });
  }

  /**
   * Returns default page limit.
   *
   * @returns {number}
   * @private
   */
  _defaultPageLimit() {
    return paginationConstants.defaultVideoListPageSize;
  }

  /**
   * Returns minimum page limit.
   *
   * @returns {number}
   * @private
   */
  _minPageLimit() {
    return paginationConstants.minVideoListPageSize;
  }

  /**
   * Returns maximum page limit.
   *
   * @returns {number}
   * @private
   */
  _maxPageLimit() {
    return paginationConstants.maxVideoListPageSize;
  }

  /**
   * Returns current page limit.
   *
   * @returns {number}
   * @private
   */
  _currentPageLimit() {
    const oThis = this;

    return oThis.limit;
  }
}

module.exports = GetTagsVideoList;
