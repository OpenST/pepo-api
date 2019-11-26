const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  GetUserVideos = require(rootPrefix + '/lib/GetUsersVideoList'),
  GetTokenService = require(rootPrefix + '/app/services/token/Get'),
  VideoTagsByTagIdPaginationCache = require(rootPrefix + '/lib/cacheManagement/single/VideoTagsByTagIdPagination'),
  UserBlockedListCache = require(rootPrefix + '/lib/cacheManagement/single/UserBlockedList'),
  tagConstants = require(rootPrefix + '/lib/globalConstant/tag'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  videoTagConstants = require(rootPrefix + '/lib/globalConstant/videoTag'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
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
   * @param {array<string>} [params.supported_entities]
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
    oThis.supportedEntities = params.supported_entities || [tagConstants.videosSupportedEntity];
    // NOTE: Do not assume that oThis.supportedEntities is a string. It comes as a string only from POSTMAN.
    // So, no need to parse this parameter.

    oThis.limit = oThis._defaultPageLimit();

    oThis.paginationTimestamp = null;
    oThis.nextPaginationTimestamp = null;
    oThis.videosCount = 0;
    oThis.responseMetaData = {};
    oThis.videoIds = [];
    oThis.videoDetails = [];
    oThis.tokenDetails = {};
    oThis.blockedReplyEntityIdMap = {};
    oThis.usersVideosMap = {};
  }

  /**
   * Async perform.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    await oThis._fetchVideoIds();

    oThis._addResponseMetaData();

    const promisesArray = [oThis._setTokenDetails(), oThis._getVideos()];
    await Promise.all(promisesArray);

    await oThis._filterRepliesByBlockedUser();

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

    // Validate supported entities.
    for (let index = 0; index < oThis.supportedEntities.length; index++) {
      if (!tagConstants.supportedEntities[oThis.supportedEntities[index]]) {
        return Promise.reject(
          responseHelper.paramValidationError({
            internal_error_identifier: 'a_s_t_gvl_1',
            api_error_identifier: 'invalid_api_params',
            params_error_identifiers: ['invalid_supported_entities'],
            debug_options: {}
          })
        );
      }
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

    let videoTagKind = videoTagConstants.allCacheKeyKind;
    if (oThis.supportedEntities.length === 1) {
      if (oThis.supportedEntities.indexOf(tagConstants.repliesSupportedEntity) > -1) {
        videoTagKind = videoTagConstants.replyCacheKeyKind;
      } else {
        videoTagKind = videoTagConstants.postCacheKeyKind; // Defaulting to this as only two kinds are possible.
      }
    }

    const cacheResponse = await new VideoTagsByTagIdPaginationCache({
      tagId: oThis.tagId,
      limit: oThis.limit,
      paginationTimestamp: oThis.paginationTimestamp,
      kind: videoTagKind
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

    if (oThis.videosCount >= oThis.limit) {
      nextPagePayloadKey[paginationConstants.paginationIdentifierKey] = {
        pagination_timestamp: oThis.nextPaginationTimestamp
      };
    }

    oThis.responseMetaData = {
      [paginationConstants.nextPagePayloadKey]: nextPagePayloadKey
    };
  }

  /**
   * Fetch token details.
   *
   * @sets oThis.tokenDetails
   *
   * @returns {Promise<result>}
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
   * @sets oThis.usersVideosMap
   *
   * @returns {Promise<result>}
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

    for (let index = 0; index < oThis.videoIds.length; index++) {
      const videoId = oThis.videoIds[index];
      if (oThis.usersVideosMap.fullVideosMap[videoId] && !oThis.blockedReplyEntityIdMap[videoId]) {
        oThis.videoDetails.push(oThis.usersVideosMap.fullVideosMap[videoId]);
      }
    }
  }

  /**
   * Filter replies if user is blocked or been blocked by
   * @returns {Promise<void>}
   * @private
   */
  async _filterRepliesByBlockedUser() {
    const oThis = this;

    let blockedByUserData = {};
    const cacheResp = await new UserBlockedListCache({ userId: oThis.currentUser.id }).fetch();
    if (cacheResp.isSuccess()) {
      blockedByUserData = cacheResp.data[oThis.currentUser.id];
    }

    if (oThis.usersVideosMap.hasOwnProperty('replyDetailsMap')) {
      for (const replyDetailId in oThis.usersVideosMap.replyDetailsMap) {
        const replyDetail = oThis.usersVideosMap.replyDetailsMap[replyDetailId],
          replyCreatorUserId = replyDetail.creatorUserId;

        if (blockedByUserData.hasBlocked[replyCreatorUserId] || blockedByUserData.blockedBy[replyCreatorUserId]) {
          delete oThis.usersVideosMap.replyDetailsMap[replyDetailId];
          oThis.blockedReplyEntityIdMap[replyDetail.entityId] = true;
        }
      }
    }
  }

  /**
   * Prepare final response.
   *
   * @returns {*|result}
   * @private
   */
  _prepareResponse() {
    const oThis = this;

    return responseHelper.successWithData({
      [entityTypeConstants.userVideoList]: oThis.videoDetails,
      [entityTypeConstants.videoDetailsMap]: oThis.usersVideosMap.videoDetailsMap || {},
      [entityTypeConstants.videoDescriptionsMap]: oThis.usersVideosMap.videoDescriptionMap || {},
      [entityTypeConstants.userProfilesMap]: oThis.usersVideosMap.userProfilesMap || {},
      [entityTypeConstants.currentUserUserContributionsMap]: oThis.usersVideosMap.currentUserUserContributionsMap || {},
      [entityTypeConstants.currentUserVideoContributionsMap]:
        oThis.usersVideosMap.currentUserVideoContributionsMap || {},
      [entityTypeConstants.userProfileAllowedActions]: oThis.usersVideosMap.userProfileAllowedActions || {},
      [entityTypeConstants.pricePointsMap]: oThis.usersVideosMap.pricePointsMap || {},
      [entityTypeConstants.replyDetailsMap]: oThis.usersVideosMap.replyDetailsMap || {},
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
