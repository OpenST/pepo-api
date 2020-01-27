const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  GetUserVideos = require(rootPrefix + '/lib/GetUsersVideoList'),
  GetTokenService = require(rootPrefix + '/app/services/token/Get'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  VideoIdsByChannelIdPaginationCache = require(rootPrefix +
    '/lib/cacheManagement/single/VideoIdsByChannelIdPagination'),
  ReplyDetailsByEntityIdsAndEntityKindCache = require(rootPrefix +
    '/lib/cacheManagement/multi/ReplyDetailsByEntityIdsAndEntityKind'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  replyDetailConstants = require(rootPrefix + '/lib/globalConstant/replyDetail'),
  channelsConstants = require(rootPrefix + '/lib/globalConstant/channel/channels'),
  channelVideosConstants = require(rootPrefix + '/lib/globalConstant/channel/channelVideos');

/**
 * Class for user video details service.
 *
 * @class GetChannelVideoList
 */
class GetChannelVideoList extends ServiceBase {
  /**
   * Constructor for user video details service.
   *
   * @param {object} params
   * @param {object} params.current_user
   * @param {number} params.channel_id
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
    oThis.channelId = params.channel_id;
    oThis.paginationIdentifier = params[paginationConstants.paginationIdentifierKey] || null;

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

    // Validate whether channel exists or not.
    await oThis._validateChannel();

    // Validate limit.
    return oThis._validatePageSize();
  }

  /**
   * Fetch and validate channel.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateChannel() {
    const oThis = this;

    const cacheResponse = await new ChannelByIdsCache({ ids: [oThis.channelId] }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    const channelObject = cacheResponse.data[oThis.channelId];

    if (
      !CommonValidators.validateNonEmptyObject(channelObject) ||
      channelObject.status !== channelsConstants.activeStatus
    ) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_c_gvl_1',
          api_error_identifier: 'entity_not_found',
          debug_options: {
            channelId: oThis.channelId
          }
        })
      );
    }
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

    const cacheResponse = await new VideoIdsByChannelIdPaginationCache({
      channelId: oThis.channelId,
      limit: oThis.limit,
      paginationTimestamp: oThis.paginationTimestamp
    }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    const channelVideoDetails = cacheResponse.data.channelVideoDetails;
    const videoIds = cacheResponse.data.videoIds || [];

    for (let index = 0; index < videoIds.length; index++) {
      const videoId = videoIds[index];
      const videoDetail = channelVideoDetails[videoId];
      oThis.videosCount++;
      oThis.videoIds.push(videoDetail.videoId);

      oThis.nextPaginationTimestamp = videoDetail.createdAt;
    }

    // If there are replies in the videos selected from video tags then fetch reply detail ids
    if (oThis.replyVideoIds.length > 0) {
      await oThis._fetchReplyDetailIds();
    }
  }

  /**
   * Fetch reply detail ids.
   *
   * @sets oThis.replyDetailIds
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchReplyDetailIds() {
    const oThis = this;

    const cacheResponse = await new ReplyDetailsByEntityIdsAndEntityKindCache({
      entityIds: oThis.replyVideoIds,
      entityKind: replyDetailConstants.videoEntityKind
    }).fetch();
    if (cacheResponse.isFailure()) {
      logger.error('Error while fetching reply detail data.');

      return Promise.reject(cacheResponse);
    }

    for (const vid in cacheResponse.data) {
      const rdId = cacheResponse.data[vid].id;
      if (rdId) {
        oThis.replyDetailIds.push(rdId);
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
      [entityTypeConstants.channelVideoList]: oThis.videoDetails,
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
   * Returns default page limit.
   *
   * @returns {number}
   * @private
   */
  _defaultPageLimit() {
    return paginationConstants.defaultChannelVideoListPageSize;
  }

  /**
   * Returns minimum page limit.
   *
   * @returns {number}
   * @private
   */
  _minPageLimit() {
    return paginationConstants.minChannelVideoListPageSize;
  }

  /**
   * Returns maximum page limit.
   *
   * @returns {number}
   * @private
   */
  _maxPageLimit() {
    return paginationConstants.maxChannelVideoListPageSize;
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

module.exports = GetChannelVideoList;
