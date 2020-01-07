const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  GetTokenService = require(rootPrefix + '/app/services/token/Get'),
  GetUserVideosList = require(rootPrefix + '/lib/GetUsersVideoList'),
  ReplyDetailsIdsByUserIdCache = require(rootPrefix + '/lib/cacheManagement/single/ReplyDetailIdsByUserId'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination'),
  replyDetailConstants = require(rootPrefix + '/lib/globalConstant/replyDetail');

/**
 * Class for user reply details service.
 *
 * @class GetUserReplyList
 */
class GetUserReplyList extends ServiceBase {
  /**
   * Constructor for video reply details service.
   *
   * @param {object} params
   * @param {string/number} params.profile_user_id
   * @param {string/number} [params.check_reply_detail_id]
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

    oThis.checkReplyDetailId = params.check_reply_detail_id || null;
    // This is the reply detail id whose presence is to be checked. In case this reply id is deleted then NOT FOUND error is sent.

    oThis.limit = oThis._defaultPageLimit();

    oThis.currentUserId = null;
    oThis.paginationTimestamp = null;
    oThis.responseMetaData = {};

    oThis.nextPaginationTimestamp = null;

    oThis.userReplies = [];
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

    const cacheResponse = await new ReplyDetailsIdsByUserIdCache({
      userId: oThis.profileUserId,
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
   * @sets oThis.userRepliesMap, oThis.userReplies
   *
   * @returns {Promise<void>}
   * @private
   */
  async _getReplyVideos() {
    const oThis = this;

    let toFetchDetailsForReplyDetailsIds = oThis.replyDetailIds;
    if (oThis.checkReplyDetailId) {
      toFetchDetailsForReplyDetailsIds = toFetchDetailsForReplyDetailsIds.concat([oThis.checkReplyDetailId]);
    }

    const userVideosObj = new GetUserVideosList({
      currentUserId: oThis.currentUserId,
      replyDetailIds: toFetchDetailsForReplyDetailsIds,
      isAdmin: oThis.isAdmin,
      fetchVideoViewDetails: 1
    });

    const response = await userVideosObj.perform();

    if (response.isFailure()) {
      return Promise.reject(response);
    }

    oThis.userRepliesMap = response.data;

    // We may not need this is in this api. Remove after checking
    if (oThis.checkReplyDetailId) {
      if (
        !oThis.userRepliesMap.replyDetailsMap[oThis.checkReplyDetailId] ||
        oThis.userRepliesMap.replyDetailsMap[oThis.checkReplyDetailId].status != replyDetailConstants.activeStatus
      ) {
        return Promise.reject(
          responseHelper.error({
            internal_error_identifier: 'a_s_r_ur_1',
            api_error_identifier: 'entity_not_found',
            debug_options: `checkReplyDetailId: ${oThis.checkReplyDetailId}`
          })
        );
      }
    }

    for (let ind = 0; ind < oThis.replyDetailIds.length; ind++) {
      const rdId = oThis.replyDetailIds[ind];
      const rdObj = oThis.userRepliesMap.replyDetailsMap[rdId];
      oThis.userReplies.push(oThis.userRepliesMap.fullVideosMap[rdObj.entityId]);
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
      [entityTypeConstants.userReplyList]: oThis.userReplies,
      [entityTypeConstants.replyDetailsMap]: oThis.userRepliesMap.replyDetailsMap,
      [entityTypeConstants.videoDescriptionsMap]: oThis.userRepliesMap.videoDescriptionMap,
      [entityTypeConstants.userProfilesMap]: oThis.userRepliesMap.userProfilesMap,
      [entityTypeConstants.currentUserUserContributionsMap]: oThis.userRepliesMap.currentUserUserContributionsMap,
      [entityTypeConstants.currentUserVideoContributionsMap]: oThis.userRepliesMap.currentUserVideoContributionsMap,
      [entityTypeConstants.currentUserReplyDetailContributionsMap]:
        oThis.userRepliesMap.currentUserReplyDetailContributionsMap,
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
    return paginationConstants.defaultUserReplyListPageSize;
  }

  /**
   * Returns minimum page limit.
   *
   * @returns {number}
   * @private
   */
  _minPageLimit() {
    return paginationConstants.minUserReplyListPageSize;
  }

  /**
   * Returns maximum page limit.
   *
   * @returns {number}
   * @private
   */
  _maxPageLimit() {
    return paginationConstants.maxUserReplyListPageSize;
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
