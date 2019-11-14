const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  GetProfile = require(rootPrefix + '/lib/user/profile/Get'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  GetTokenService = require(rootPrefix + '/app/services/token/Get'),
  UserBlockedListCache = require(rootPrefix + '/lib/cacheManagement/single/UserBlockedList'),
  VideoDetailsByUserIdCache = require(rootPrefix + '/lib/cacheManagement/single/VideoDetailsByUserIdPagination'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination');

/**
 * Class for user video details service.
 *
 * @class GetVideoList
 */
class GetVideoList extends ServiceBase {
  /**
   * Constructor for user video details service.
   *
   * @param {object} params
   * @param {string/number} params.profile_user_id
   * @param {object} [params.current_user]
   * @param {boolean} [params.is_admin]
   * @param {string} [params.pagination_identifier]
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.profileUserId = +params.profile_user_id;
    oThis.currentUser = params.current_user;
    oThis.isAdmin = params.is_admin || false;
    oThis.paginationIdentifier = params[paginationConstants.paginationIdentifierKey] || null;

    oThis.limit = oThis._defaultPageLimit();

    oThis.currentUserId = null;
    oThis.paginationTimestamp = null;
    oThis.nextPaginationTimestamp = null;
    oThis.videosCount = 0;
    oThis.videoDetails = [];
    oThis.videoIds = [];
    oThis.tokenDetails = {};
    oThis.profileUserObj = null;
  }

  /**
   * Async perform.
   *
   * @sets oThis.profileUserObj
   *
   * @return {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    let resp = null;

    if (oThis.isAdmin) {
      resp = await oThis._validateInactiveProfileUserId();
    } else {
      resp = await oThis._validateProfileUserId();
    }
    oThis.profileUserObj = resp.data.userObject;

    await oThis._fetchVideoIds();

    oThis._addResponseMetaData();

    const promisesArray = [];
    promisesArray.push(oThis._setTokenDetails());
    promisesArray.push(oThis._getVideos());
    await Promise.all(promisesArray);

    return oThis._prepareResponse();
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

    oThis.currentUserId = oThis.currentUser ? Number(oThis.currentUser.id) : 0;

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
   * @sets oThis.videosCount, oThis.videoDetails, oThis.videoIds, oThis.nextPaginationTimestamp
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchVideoIds() {
    const oThis = this;

    // Todo: do we need to check blocked user list here???
    // If not an admin, only then perform further validations.
    if (!oThis.isAdmin) {
      // If user's profile(not self) is not approved, videos would not be shown.
      if (oThis.currentUserId != oThis.profileUserId && !UserModel.isUserApprovedCreator(oThis.profileUserObj)) {
        return responseHelper.successWithData({});
      }
      // Check for blocked user's list.
      const cacheResp = await new UserBlockedListCache({ userId: oThis.currentUserId }).fetch();
      if (cacheResp.isFailure()) {
        return Promise.reject(cacheResp);
      }
      const blockedByUserInfo = cacheResp.data[oThis.currentUserId];
      if (blockedByUserInfo.hasBlocked[oThis.profileUserId] || blockedByUserInfo.blockedBy[oThis.profileUserId]) {
        return responseHelper.successWithData({});
      }
    }

    const cacheResponse = await new VideoDetailsByUserIdCache({
      userId: oThis.profileUserId,
      limit: oThis.limit,
      paginationTimestamp: oThis.paginationTimestamp
    }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    const videoDetails = cacheResponse.data.videoDetails;
    const videoIds = cacheResponse.data.videoIds || [];

    for (let ind = 0; ind < videoIds.length; ind++) {
      const videoId = videoIds[ind];
      const videoDetail = videoDetails[videoId];
      oThis.videosCount++;
      oThis.videoDetails.push(videoDetail);
      oThis.videoIds.push(videoDetail.videoId);

      oThis.nextPaginationTimestamp = videoDetail.createdAt;
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
   * @sets oThis.profileResponse
   *
   * @return {Promise<result>}
   * @private
   */
  async _getVideos() {
    const oThis = this;

    const getProfileObj = new GetProfile({
      userIds: [oThis.profileUserId],
      currentUserId: oThis.currentUserId,
      videoIds: oThis.videoIds,
      isAdmin: oThis.isAdmin
    });

    const response = await getProfileObj.perform();
    if (response.isFailure()) {
      return Promise.reject(response);
    }

    oThis.profileResponse = response.data;

    return responseHelper.successWithData({});
  }

  /**
   * Prepare final response.
   *
   * @return {Promise<result>}
   * @private
   */
  async _prepareResponse() {
    const oThis = this;

    return responseHelper.successWithData({
      [entityType.userVideoList]: oThis.videoDetails,
      usersByIdMap: oThis.profileResponse.usersByIdMap,
      userStat: oThis.profileResponse.userStat,
      [entityType.userProfilesMap]: oThis.profileResponse.userProfilesMap,
      tags: oThis.profileResponse.tags,
      linkMap: oThis.profileResponse.linkMap,
      imageMap: oThis.profileResponse.imageMap,
      videoMap: oThis.profileResponse.videoMap,
      [entityType.videoDetailsMap]: oThis.profileResponse.videoDetailsMap,
      [entityType.videoDescriptionsMap]: oThis.profileResponse.videoDescriptionMap,
      [entityType.currentUserUserContributionsMap]: oThis.profileResponse.currentUserUserContributionsMap,
      [entityType.currentUserVideoContributionsMap]: oThis.profileResponse.currentUserVideoContributionsMap,
      [entityType.userProfileAllowedActions]: oThis.profileResponse.userProfileAllowedActions,
      tokenUsersByUserIdMap: oThis.profileResponse.tokenUsersByUserIdMap,
      [entityType.pricePointsMap]: oThis.profileResponse.pricePointsMap,
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

module.exports = GetVideoList;
