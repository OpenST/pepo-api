const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  GetUserVideos = require(rootPrefix + '/lib/GetUsersVideoList'),
  GetTokenService = require(rootPrefix + '/app/services/token/Get'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  ChannelVideoIdsByChannelIdPaginationCache = require(rootPrefix +
    '/lib/cacheManagement/single/ChannelVideoIdsByChannelIdPagination'),
  ChannelTagVideoIdsByTagIdAndChannelIdPaginationCache = require(rootPrefix +
    '/lib/cacheManagement/single/ChannelTagVideoIdsByTagIdAndChannelIdPagination'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  channelsConstants = require(rootPrefix + '/lib/globalConstant/channel/channels');

/**
 * Class for channel video details service.
 *
 * @class GetChannelVideoList
 */
class GetChannelVideoList extends ServiceBase {
  /**
   * Constructor for channel video details service.
   *
   * @param {object} params
   * @param {object} params.current_user
   * @param {number} params.channel_id
   * @param {string} [params.pagination_identifier]
   * @param {number} [params.filter_by_tag_id]
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
    oThis.filterByTagId = params[paginationConstants.filterByTagIdKey] || null;

    oThis.limit = oThis._defaultPageLimit();
    oThis.page = 1;

    oThis.videoIds = [];
    oThis.channelVideoDetails = {};

    oThis.responseMetaData = {};
    oThis.videoDetails = [];
    oThis.tokenDetails = {};
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

    oThis._setChannelVideoList();

    return oThis._prepareResponse();
  }

  /**
   * Validate and sanitize.
   *
   * @sets oThis.page
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    if (oThis.paginationIdentifier) {
      const parsedPaginationParams = oThis._parsePaginationParams(oThis.paginationIdentifier);

      oThis.page = parsedPaginationParams.page; // Override paginationTimestamp number.
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
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_c_gvl_1',
          api_error_identifier: 'resource_not_found',
          params_error_identifiers: ['invalid_channel_id'],
          debug_options: {
            channelId: oThis.channelId,
            channelDetails: channelObject
          }
        })
      );
    }
  }

  /**
   * Fetch video ids.
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchVideoIds() {
    const oThis = this;

    if (oThis.filterByTagId) {
      await oThis._fetchVideosFromChannelTagVideos();
    } else {
      await oThis._fetchVideosFromChannelVideos();
    }
  }

  /**
   * Fetch videos from channel tag videos.
   *
   * @sets oThis.videoIds, oThis.channelVideoDetails
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchVideosFromChannelTagVideos() {
    const oThis = this;

    const cacheResponse = await new ChannelTagVideoIdsByTagIdAndChannelIdPaginationCache({
      tagId: oThis.filterByTagId,
      channelId: oThis.channelId,
      limit: oThis.limit,
      page: oThis.page
    }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    oThis.videoIds = cacheResponse.data.videoIds || [];
    oThis.channelVideoDetails = cacheResponse.data.channelVideoDetails;
  }

  /**
   * Fetch video ids from channel videos.
   *
   * @sets oThis.videoIds, oThis.channelVideoDetails
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchVideosFromChannelVideos() {
    const oThis = this;

    const cacheResponse = await new ChannelVideoIdsByChannelIdPaginationCache({
      channelId: oThis.channelId,
      limit: oThis.limit,
      page: oThis.page
    }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    oThis.videoIds = cacheResponse.data.videoIds || [];
    oThis.channelVideoDetails = cacheResponse.data.channelVideoDetails;
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

    if (oThis.videoIds.length >= oThis.limit) {
      nextPagePayloadKey[paginationConstants.paginationIdentifierKey] = {
        page: oThis.page + 1
      };
    }

    oThis.responseMetaData = {
      [paginationConstants.nextPagePayloadKey]: nextPagePayloadKey,
      [paginationConstants.filterByTagIdKey]: oThis.filterByTagId
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
      currentUserId: oThis.currentUser ? oThis.currentUser.id : 0,
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
   * Set channel video list.
   *
   * @set oThis.videoDetails
   *
   * @returns {*|result}
   * @private
   */
  _setChannelVideoList() {
    const oThis = this;

    for (let index = 0; index < oThis.videoIds.length; index++) {
      const videoId = oThis.videoIds[index];
      if (CommonValidators.validateNonEmptyObject(oThis.usersVideosMap.fullVideosMap[videoId])) {
        const channelVideoDetail = oThis.usersVideosMap.fullVideosMap[videoId];
        channelVideoDetail.isPinned = oThis.channelVideoDetails[videoId].pinnedAt ? 1 : 0;
        oThis.videoDetails.push(channelVideoDetail);
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
      [entityTypeConstants.channelsMap]: oThis.usersVideosMap.channelsMap,
      [entityTypeConstants.videoDescriptionsMap]: oThis.usersVideosMap.videoDescriptionMap,
      [entityTypeConstants.currentUserUserContributionsMap]: oThis.usersVideosMap.currentUserUserContributionsMap,
      [entityTypeConstants.currentUserVideoContributionsMap]: oThis.usersVideosMap.currentUserVideoContributionsMap,
      [entityTypeConstants.currentUserVideoRelationsMap]: oThis.usersVideosMap.currentUserVideoRelationsMap,
      [entityTypeConstants.pricePointsMap]: oThis.usersVideosMap.pricePointsMap,
      usersByIdMap: oThis.usersVideosMap.usersByIdMap,
      tags: oThis.usersVideosMap.tags,
      linkMap: oThis.usersVideosMap.linkMap,
      imageMap: oThis.usersVideosMap.imageMap,
      videoMap: oThis.usersVideosMap.videoMap,
      [entityTypeConstants.userProfileAllowedActions]: oThis.usersVideosMap.userProfileAllowedActions,
      tokenUsersByUserIdMap: oThis.usersVideosMap.tokenUsersByUserIdMap,
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
