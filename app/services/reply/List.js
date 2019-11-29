const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  GetTokenService = require(rootPrefix + '/app/services/token/Get'),
  GetUserVideosList = require(rootPrefix + '/lib/GetUsersVideoList'),
  ReplyDetailsByParentVideoPaginationCache = require(rootPrefix +
    '/lib/cacheManagement/single/ReplyDetailsByParentVideoPagination'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination');

/**
 * Class for video reply details service.
 *
 * @class GetReplyList
 */
class GetReplyList extends ServiceBase {
  /**
   * Constructor for video reply details service.
   *
   * @param {object} params
   * @param {string/number} params.video_id
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

    oThis.videoId = +params.video_id;
    oThis.currentUser = params.current_user;
    oThis.isAdmin = params.is_admin || false;
    oThis.paginationIdentifier = params[paginationConstants.paginationIdentifierKey] || null;

    oThis.limit = oThis._defaultPageLimit();

    oThis.currentUserId = null;
    oThis.paginationTimestamp = null;
    oThis.responseMetaData = {};

    oThis.nextPaginationTimestamp = null;

    oThis.videoReplies = [];
    oThis.replyDetailIds = [];
    oThis.userRepliesMap = {};
    oThis.tokenDetails = null;
  }

  /**
   * Async perform.
   *
   * @returns {Promise<result>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    await oThis._fetchReplyDetailIds();

    const promisesArray = [oThis._setTokenDetails(), oThis._getReplyVideos()];
    await Promise.all(promisesArray);

    oThis._addResponseMetaData();

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
   * Fetch video reply details.
   *
   * @sets oThis.replyDetails
   *
   * @returns {Promise<*>}
   * @private
   */
  async _fetchReplyDetailIds() {
    const oThis = this;

    const cacheResponse = await new ReplyDetailsByParentVideoPaginationCache({
      videoId: oThis.videoId,
      limit: oThis.limit,
      paginationTimestamp: oThis.paginationTimestamp
    }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    oThis.replyDetailIds = cacheResponse.data.replyDetailIds;
  }

  /**
   * Fetch token details.
   *
   * @sets oThis.tokenDetails
   *
   * @returns {Promise<void>}
   * @private
   */
  async _setTokenDetails() {
    const oThis = this;

    const tokenResp = await new GetTokenService().perform();
    if (tokenResp.isFailure()) {
      return Promise.reject(tokenResp);
    }

    oThis.tokenDetails = tokenResp.data.tokenDetails;
  }

  /**
   * Get videos.
   *
   * @sets oThis.userRepliesMap, oThis.videoReplies
   *
   * @returns {Promise<void>}
   * @private
   */
  async _getReplyVideos() {
    const oThis = this;

    const userVideosObj = new GetUserVideosList({
      currentUserId: oThis.currentUserId,
      replyDetailIds: oThis.replyDetailIds,
      isAdmin: oThis.isAdmin,
      fetchVideoViewDetails: 1
    });

    const response = await userVideosObj.perform();
    if (response.isFailure()) {
      return Promise.reject(response);
    }

    oThis.userRepliesMap = response.data;

    for (let ind = 0; ind < oThis.replyDetailIds.length; ind++) {
      const rdId = oThis.replyDetailIds[ind];
      const rdObj = oThis.userRepliesMap.replyDetailsMap[rdId];
      oThis.videoReplies.push(oThis.userRepliesMap.fullVideosMap[rdObj.entityId]);
      if (ind === oThis.replyDetailIds.length - 1) {
        oThis.nextPaginationTimestamp = rdObj.createdAt;
      }
    }
  }

  /**
   * Add next page meta data.
   *
   * @sets oThis.responseMetaData
   *
   * @returns {void}
   * @private
   */
  _addResponseMetaData() {
    const oThis = this;

    const nextPagePayloadKey = {};

    if (oThis.replyDetailIds.length >= oThis.limit) {
      nextPagePayloadKey[paginationConstants.paginationIdentifierKey] = {
        pagination_timestamp: oThis.nextPaginationTimestamp
      };
    }

    oThis.responseMetaData = {
      [paginationConstants.nextPagePayloadKey]: nextPagePayloadKey
    };
  }

  /**
   * Prepare final response.
   *
   * @returns {Promise<result>}
   * @private
   */
  async _prepareResponse() {
    const oThis = this;

    return responseHelper.successWithData({
      [entityTypeConstants.videoReplyList]: oThis.videoReplies,
      [entityTypeConstants.replyDetailsMap]: oThis.userRepliesMap.replyDetailsMap,
      [entityTypeConstants.videoDescriptionsMap]: oThis.userRepliesMap.videoDescriptionMap,
      [entityTypeConstants.userProfilesMap]: oThis.userRepliesMap.userProfilesMap,
      [entityTypeConstants.currentUserUserContributionsMap]: oThis.userRepliesMap.currentUserUserContributionsMap,
      [entityTypeConstants.currentUserVideoContributionsMap]:
        oThis.userRepliesMap.currentUserVideoContributionsMap,
      [entityTypeConstants.currentUserReplyDetailContributionsMap]: oThis.userRepliesMap.currentUserReplyDetailContributionsMap,
      [entityTypeConstants.currentUserReplyDetailsRelationsMap]:
        oThis.userRepliesMap.currentUserReplyDetailsRelationsMap,
      [entityTypeConstants.userProfileAllowedActions]: oThis.userRepliesMap.userProfileAllowedActions,
      [entityTypeConstants.pricePointsMap]: oThis.userRepliesMap.pricePointsMap,
      usersByIdMap: oThis.userRepliesMap.usersByIdMap,
      userStat: oThis.userRepliesMap.userStat,
      tags: oThis.userRepliesMap.tags,
      linkMap: oThis.userRepliesMap.linkMap,
      imageMap: oThis.userRepliesMap.imageMap,
      videoMap: oThis.userRepliesMap.videoMap,
      tokenUsersByUserIdMap: oThis.userRepliesMap.tokenUsersByUserIdMap,
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

module.exports = GetReplyList;
