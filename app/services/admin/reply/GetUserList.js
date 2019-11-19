const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  GetUsersVideoList = require(rootPrefix + '/lib/GetUsersVideoList'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  GetTokenService = require(rootPrefix + '/app/services/token/Get'),
  UserBlockedListCache = require(rootPrefix + '/lib/cacheManagement/single/UserBlockedList'),
  ReplyDetailsByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/ReplyDetailsByIds'),
  ReplyDetailsByUserIdPaginationCache = require(rootPrefix +
    '/lib/cacheManagement/single/ReplyDetailsByUserIdPagination'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination'),
  adminEntityType = require(rootPrefix + '/lib/globalConstant/adminEntityType');

/**
 * Class for user reply list service.
 *
 * @class GetUserReplyList
 */
class GetUserReplyList extends ServiceBase {
  /**
   * Constructor for user reply list service.
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

    oThis.usersVideosMap = {};
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

    console.log('oThis.profileUserObj ======', oThis.profileUserObj);

    await oThis._fetchVideoIds();

    oThis._addResponseMetaData();

    const promisesArray = [];
    promisesArray.push(oThis._getReplyDetails());
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

    const cacheResponse = await new ReplyDetailsByUserIdPaginationCache({
      userId: oThis.profileUserId,
      limit: oThis.limit,
      paginationTimestamp: oThis.paginationTimestamp
    }).fetch();

    console.log('cacheResponse  =========', cacheResponse);

    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    const replyDetails = cacheResponse.data.replyDetails,
      videoIds = cacheResponse.data.videoIds || [];

    oThis.replyDetailIds = cacheResponse.data.replyDetailIds;

    for (let ind = 0; ind < videoIds.length; ind++) {
      const videoId = videoIds[ind];
      const replyDetail = replyDetails[videoId];
      oThis.videosCount++;
      oThis.videoIds.push(replyDetail.entityId);

      oThis.nextPaginationTimestamp = replyDetail.createdAt;
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
   * Get reply details.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _getReplyDetails() {
    const oThis = this,
      replyDetailsResp = await new ReplyDetailsByIdsCache({ ids: oThis.replyDetailIds }).fetch();

    if (replyDetailsResp.isFailure()) {
      return Promise.reject(replyDetailsResp);
    }

    oThis.replyDetailsMap = replyDetailsResp.data;
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
    const usersVideoListObj = new GetUsersVideoList({
      currentUserId: oThis.currentUserId,
      isAdmin: oThis.isAdmin,
      replyDetailIds: oThis.replyDetailIds
    });

    const response = await usersVideoListObj.perform();
    if (response.isFailure()) {
      return Promise.reject(response);
    }

    oThis.usersVideosMap = response.data;

    for (let ind = 0; ind < oThis.videoIds.length; ind++) {
      let vid = oThis.videoIds[ind],
        vdObj = oThis.usersVideosMap.fullVideosMap[vid];

      if (vdObj) {
        oThis.videoDetails.push(vdObj);
      }
    }

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
      [adminEntityType.userVideoList]: oThis.videoDetails,
      usersByIdMap: oThis.usersVideosMap.usersByIdMap || {},
      userStat: oThis.usersVideosMap.userStat || {},
      [adminEntityType.userProfilesMap]: oThis.usersVideosMap.userProfilesMap || {},
      tags: oThis.usersVideosMap.tags || {},
      linkMap: oThis.usersVideosMap.linkMap || {},
      imageMap: oThis.usersVideosMap.imageMap || {},
      videoMap: oThis.usersVideosMap.videoMap || {},
      [adminEntityType.videoDetailsMap]: oThis.usersVideosMap.videoDetailsMap || {},
      [adminEntityType.videoDescriptionsMap]: oThis.usersVideosMap.videoDescriptionMap || {},
      [adminEntityType.currentUserUserContributionsMap]: oThis.usersVideosMap.currentUserUserContributionsMap || {},
      [adminEntityType.currentUserVideoContributionsMap]: oThis.usersVideosMap.currentUserVideoContributionsMap || {},
      [adminEntityType.pricePointsMap]: oThis.usersVideosMap.pricePointsMap || {},
      [adminEntityType.replyDetailsMap]: oThis.replyDetailsMap || {},
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

module.exports = GetUserReplyList;
