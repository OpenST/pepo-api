const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  GetUserVideos = require(rootPrefix + '/lib/GetUsersVideoList'),
  GetTokenService = require(rootPrefix + '/app/services/token/Get'),
  VideoTagsByTagIdPaginationCache = require(rootPrefix + '/lib/cacheManagement/single/VideoTagsByTagIdPagination'),
  ReplyDetailsByEntityIdsAndEntityKindCache = require(rootPrefix +
    '/lib/cacheManagement/multi/ReplyDetailsByEntityIdsAndEntityKind'),
  tagConstants = require(rootPrefix + '/lib/globalConstant/tag'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  videoTagConstants = require(rootPrefix + '/lib/globalConstant/videoTag'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  replyDetailConstants = require(rootPrefix + '/lib/globalConstant/replyDetail'),
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
    oThis.usersVideosMap = {};
    oThis.replyDetailIds = [];
    oThis.replyVideoIds = [];
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
      if (videoTagsDetail.videoKind == videoTagConstants.replyKind) {
        oThis.replyVideoIds.push(videoTagsDetail.videoId);
      }
      oThis.nextPaginationTimestamp = videoTagsDetail.createdAt;
    }

    // If there are replies in the videos selected from video tags then fetch reply detail ids
    if (oThis.replyVideoIds.length > 0) {
      await oThis._fetchReplyDetailIds();
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

    const userVideosObj = new GetUserVideos({
      currentUserId: oThis.currentUser.id,
      videoIds: oThis.videoIds,
      replyDetailIds: oThis.replyDetailIds,
      isAdmin: false,
      filterUserBlockedReplies: 1
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
      if (oThis.usersVideosMap.fullVideosMap[videoId]) {
        oThis.videoDetails.push(oThis.usersVideosMap.fullVideosMap[videoId]);
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
      [entityTypeConstants.videoDetailsMap]: oThis.usersVideosMap.videoDetailsMap,
      [entityTypeConstants.videoDescriptionsMap]: oThis.usersVideosMap.videoDescriptionMap,
      [entityTypeConstants.userProfilesMap]: oThis.usersVideosMap.userProfilesMap,
      [entityTypeConstants.currentUserUserContributionsMap]: oThis.usersVideosMap.currentUserUserContributionsMap,
      [entityTypeConstants.currentUserVideoContributionsMap]: oThis.usersVideosMap.currentUserVideoContributionsMap,
      [entityTypeConstants.currentUserReplyDetailContributionsMap]:
        oThis.usersVideosMap.currentUserReplyDetailContributionsMap,
      [entityTypeConstants.userProfileAllowedActions]: oThis.usersVideosMap.userProfileAllowedActions,
      [entityTypeConstants.pricePointsMap]: oThis.usersVideosMap.pricePointsMap,
      [entityTypeConstants.replyDetailsMap]: oThis.usersVideosMap.replyDetailsMap,
      usersByIdMap: oThis.usersVideosMap.usersByIdMap,
      userStat: oThis.usersVideosMap.userStat,
      tags: oThis.usersVideosMap.tags,
      linkMap: oThis.usersVideosMap.linkMap,
      imageMap: oThis.usersVideosMap.imageMap,
      videoMap: oThis.usersVideosMap.videoMap,
      tokenUsersByUserIdMap: oThis.usersVideosMap.tokenUsersByUserIdMap,
      [entityTypeConstants.currentUserVideoRelationsMap]: oThis.usersVideosMap.currentUserVideoRelationsMap,
      tokenDetails: oThis.tokenDetails,
      meta: oThis.responseMetaData
    });
  }

  /**
   * Fetch reply detail ids
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchReplyDetailIds() {
    const oThis = this;

    const replyDetailsByEntityIdsAndEntityKindCacheRsp = await new ReplyDetailsByEntityIdsAndEntityKindCache({
      entityIds: oThis.replyVideoIds,
      entityKind: replyDetailConstants.videoEntityKind
    }).fetch();

    if (replyDetailsByEntityIdsAndEntityKindCacheRsp.isFailure()) {
      logger.error('Error while fetching reply detail data.');

      return Promise.reject(replyDetailsByEntityIdsAndEntityKindCacheRsp);
    }

    for (const vid in replyDetailsByEntityIdsAndEntityKindCacheRsp.data) {
      const rdId = replyDetailsByEntityIdsAndEntityKindCacheRsp.data[vid].id;
      // TODO feed - remove Number check
      if (Number(rdId) > 0) {
        oThis.replyDetailIds.push(rdId);
      }
    }
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
