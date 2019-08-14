const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  GetProfile = require(rootPrefix + '/lib/user/profile/Get'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  GetTokenService = require(rootPrefix + '/app/services/token/Get'),
  UserMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  VideoDetailsByUserIdCache = require(rootPrefix + '/lib/cacheManagement/single/VideoDetailsByUserIdPagination'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination');

/**
 * Class for user video details service.
 *
 * @class UserVideos
 */
class UserVideos extends ServiceBase {
  /**
   * Constructor for user video details service.
   *
   * @param {object} params
   * @param {string/number} params.profile_user_id
   * @param {object} [params.current_user]
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
    oThis.paginationIdentifier = params[paginationConstants.paginationIdentifierKey] || null;

    oThis.currentUserId = null;
    oThis.limit = oThis._defaultPageLimit();
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
   * @return {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    let promisesArray = [];
    promisesArray.push(oThis._validateAndSanitizeParams());
    promisesArray.push(oThis._validateProfileUserId());
    await Promise.all(promisesArray);

    await oThis._fetchVideoIds();
    oThis._addResponseMetaData();

    promisesArray = [];
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
   * Validate whether profile userId is correct or not.
   *
   * @returns {Promise<*>}
   * @private
   */
  async _validateProfileUserId() {
    const oThis = this;

    const profileUserByIdResponse = await new UserMultiCache({ ids: [oThis.profileUserId] }).fetch();

    if (profileUserByIdResponse.isFailure()) {
      return Promise.reject(profileUserByIdResponse);
    }

    if (!CommonValidators.validateNonEmptyObject(profileUserByIdResponse.data[oThis.profileUserId])) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_u_v_1',
          api_error_identifier: 'unauthorized_api_request',
          debug_options: {
            reason: 'Invalid userId',
            profileUserId: oThis.profileUserId,
            currentUserId: oThis.currentUserId
          }
        })
      );
    }

    oThis.profileUserObj = profileUserByIdResponse.data[oThis.profileUserId];
  }

  /**
   * Fetch video ids.
   *
   * @sets oThis.nextPaginationTimestamp
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchVideoIds() {
    const oThis = this;

    // If user's profile(not self) is not approved, videos would not be shown.
    if (oThis.currentUserId != oThis.profileUserId && !UserModel.isUserApprovedCreator(oThis.profileUserObj)) {
      return responseHelper.successWithData({});
    }

    const cacheResponse = await new VideoDetailsByUserIdCache({
      userId: oThis.profileUserId,
      limit: oThis.limit,
      paginationTimestamp: oThis.paginationTimestamp
    }).fetch();

    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    const videoDetails = cacheResponse.data;

    for (const videoId in videoDetails) {
      const videoDetail = videoDetails[videoId];
      oThis.videosCount++;
      oThis.videoDetails.push(videoDetail);
      oThis.videoIds.push(videoDetail.videoId);
      if (!oThis.nextPaginationTimestamp) {
        oThis.nextPaginationTimestamp = videoDetail.createdAt;
      }
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
   * @return {Promise<*>}
   * @private
   */
  async _setTokenDetails() {
    const oThis = this;

    const getTokenServiceObj = new GetTokenService({});

    const tokenResp = await getTokenServiceObj.perform();

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
   * @return {Promise<*>}
   * @private
   */
  async _getVideos() {
    const oThis = this;

    const getProfileObj = new GetProfile({
      userIds: [oThis.profileUserId],
      currentUserId: oThis.currentUserId,
      videoIds: oThis.videoIds
    });

    const response = await getProfileObj.perform();

    if (response.isFailure()) {
      return Promise.reject(response);
    }

    oThis.profileResponse = response.data;

    return responseHelper.successWithData({});
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

  /**
   * Prepare final response.
   *
   * @return {Promise<*|result>}
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
      [entityType.currentUserUserContributionsMap]: oThis.profileResponse.currentUserUserContributionsMap,
      [entityType.currentUserVideoContributionsMap]: oThis.profileResponse.currentUserVideoContributionsMap,
      [entityType.userProfileAllowedActions]: oThis.profileResponse.userProfileAllowedActions,
      tokenUsersByUserIdMap: oThis.profileResponse.tokenUsersByUserIdMap,
      [entityType.pricePointsMap]: oThis.profileResponse.pricePointsMap,
      tokenDetails: oThis.tokenDetails,
      meta: oThis.responseMetaData
    });
  }
}

module.exports = UserVideos;
