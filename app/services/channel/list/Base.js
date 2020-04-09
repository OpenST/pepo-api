const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  FetchAssociatedEntities = require(rootPrefix + '/lib/FetchAssociatedEntities'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  GetCurrentUserChannelRelationsLib = require(rootPrefix + '/lib/channel/GetCurrentUserChannelRelations'),
  ChannelTagByChannelIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelTagByChannelIds'),
  ChannelStatByChannelIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelStatByChannelIds'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  MeetingGetLiveChannelIdsCache = require(rootPrefix + '/lib/cacheManagement/single/meeting/MeetingGetLiveChannelIds'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  channelConstants = require(rootPrefix + '/lib/globalConstant/channel/channels'),
  ChannelModel = require(rootPrefix + '/app/models/mysql/channel/Channel');

// Declare variables.
const searchTermMaxLength = 200; // This is to ensure that cache key max is not violated.

/**
 * Class to get channels list.
 *
 * @class ChannelListBase
 */
class ChannelListBase extends ServiceBase {
  /**
   * Constructor to search channels.
   *
   * @param {object} params
   * @param {object} [params.current_user]
   * @param {string} [params.q]
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
    oThis.channelPrefix = params.q || null;
    oThis.paginationIdentifier = params[paginationConstants.paginationIdentifierKey] || null;

    oThis.currentPageNumber = null;
    oThis.limit = paginationConstants.defaultChannelListPageSize;

    oThis.allChannelIds = [];
    oThis.liveChannelIds = [];
    oThis.nextPageNumber = null;
    oThis.channelIds = [];

    oThis.channels = [];
    oThis.imageIds = [];
    oThis.textIds = [];
    oThis.searchResults = [];
    oThis.channelIdToTagIdsMap = {};
    oThis.links = {};
    oThis.tags = {};
    oThis.imageMap = {};
    oThis.textsMap = {};
    oThis.channelStatsMap = {};
    oThis.currentUserChannelRelations = {};
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

    if (oThis._shouldSearch()) {
      await oThis._setChannelIdsForSearch();
    } else {
      await oThis._setChannelIdsForList();
    }

    await oThis._fetchAllAssociatedEntities();

    return oThis._formatResponse();
  }

  /**
   * Validate and sanitize specific params.
   *
   * @sets oThis.channelPrefix, oThis.pageNumber, oThis.limit
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    oThis.channelPrefix = basicHelper.filterSearchTerm(oThis.channelPrefix);

    if (oThis.paginationIdentifier) {
      const parsedPaginationParams = oThis._parsePaginationParams(oThis.paginationIdentifier);
      oThis.currentPageNumber = parsedPaginationParams.page; // Override page
    } else {
      oThis.currentPageNumber = 1;
    }

    if (!oThis.channelPrefix || oThis.channelPrefix.length >= searchTermMaxLength) {
      oThis.channelPrefix = null;
    }
  }

  /**
   * Return true if search response needed else for list response return false
   *
   * @returns {number}
   * @private
   */
  _shouldSearch() {
    const oThis = this;

    return CommonValidators.validateNonBlankString(oThis.channelPrefix);
  }

  /**
   * Fetch entities and set channel ids for search.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _setChannelIdsForList() {
    const oThis = this;

    await oThis._getAllChannelIds();

    await oThis._getLiveChannelIds();

    const offset = oThis._offset();

    if (oThis._showLiveChannelsOnTop() && oThis._isFirstPage()) {
      oThis.channelIds = oThis.liveChannelIds;
    }

    const currentChannelIds = oThis.allChannelIds.slice(offset, offset + oThis.limit);

    if (oThis.allChannelIds.length > offset + oThis.limit) {
      oThis.nextPageNumber = oThis.currentPageNumber + 1;
    }

    oThis.channelIds = [...oThis.channelIds, ...currentChannelIds];
    oThis.channelIds = basicHelper.uniquate(oThis.channelIds);
  }

  /**
   * Get Live Channel Ids in the list with there sorting logic.
   *
   * @sets oThis.liveChannelIds
   *
   * @returns {Promise<never>}
   * @private
   */
  async _getLiveChannelIds() {
    const oThis = this;

    if (!oThis._showLiveChannelsOnTop()) {
      return;
    }

    const cacheResp = await new MeetingGetLiveChannelIdsCache().fetch();
    if (cacheResp.isFailure()) {
      return Promise.reject(cacheResp);
    }

    const liveChannelIds = cacheResp.data.ids;

    if (liveChannelIds.length === 0) {
      return;
    }

    const allChannelMap = {};
    for (let i = 0; i < oThis.allChannelIds.length; i++) {
      allChannelMap[oThis.allChannelIds[i]] = i + 1;
    }

    for (let i = 0; i < liveChannelIds.length; i++) {
      const cid = liveChannelIds[i];
      if (allChannelMap[cid]) {
        oThis.liveChannelIds.push(cid);
      }
    }

    oThis.liveChannelIds.sort(function(a, b) {
      return allChannelMap[a] - allChannelMap[b];
    });
  }

  /**
   * Fetch All Associated Entities.
   *
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchAllAssociatedEntities() {
    const oThis = this;

    await oThis._getChannels();

    await oThis._fetchChannelTagIds();

    await Promise.all([
      oThis._fetchAssociatedEntities(),
      oThis._fetchChannelStats(),
      oThis._fetchCurrentUserChannelRelations()
    ]);
  }

  /**
   * Get channels.
   *
   * @sets oThis.channels, oThis.channelIds, oThis.imageIds, oThis.textIds, oThis.searchResults
   *
   *
   * @returns {Promise<void>}
   * @private
   */
  async _getChannels() {
    const oThis = this;

    if (oThis.channelIds.length === 0) {
      return;
    }

    const activeChannelIds = [];

    const cacheResponse = await new ChannelByIdsCache({ ids: oThis.channelIds }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    oThis.channels = cacheResponse.data;

    for (let index = 0; index < oThis.channelIds.length; index++) {
      const channelId = oThis.channelIds[index],
        channel = oThis.channels[channelId];

      if (channel.status === channelConstants.activeStatus) {
        activeChannelIds.push(channelId);
        if (channel.coverImageId) {
          oThis.imageIds.push(channel.coverImageId);
        }

        if (channel.descriptionId) {
          oThis.textIds.push(channel.descriptionId);
        }

        if (channel.taglineId) {
          oThis.textIds.push(channel.taglineId);
        }

        oThis.searchResults.push({
          id: channelId,
          name: channel.name,
          status: channel.status,
          updatedAt: channel.updatedAt
        });
      } else {
        delete oThis.channels[channelId];
      }
    }

    oThis.channelIds = activeChannelIds;
  }

  /**
   * Fetch channel tag ids.
   *
   * @sets oThis.channelIdToTagIdsMap
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchChannelTagIds() {
    const oThis = this;

    if (oThis.channelIds.length === 0) {
      return;
    }

    const cacheResponse = await new ChannelTagByChannelIdsCache({ channelIds: oThis.channelIds }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    const cacheData = cacheResponse.data;

    for (const channelId in cacheData) {
      oThis.channelIdToTagIdsMap[channelId] = cacheData[channelId];
    }
  }

  /**
   * Fetch all associated entities
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchAssociatedEntities() {
    const oThis = this;

    if (oThis.textIds.length === 0 && oThis.imageIds.length === 0) {
      return;
    }

    const associatedEntitiesResp = await new FetchAssociatedEntities({
      textIds: oThis.textIds,
      imageIds: oThis.imageIds
    }).perform();

    oThis.links = associatedEntitiesResp.data.links;
    oThis.tags = associatedEntitiesResp.data.tags;
    oThis.imageMap = associatedEntitiesResp.data.imagesMap;
    oThis.textsMap = associatedEntitiesResp.data.textMap;
  }

  /**
   * Fetch channel stats.
   *
   * @sets oThis.channelStatsMap
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchChannelStats() {
    const oThis = this;

    if (oThis.channelIds.length === 0) {
      return;
    }

    const cacheResponse = await new ChannelStatByChannelIdsCache({ channelIds: oThis.channelIds }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    oThis.channelStatsMap = cacheResponse.data;
  }

  /**
   * Fetch current user channel relations.
   *
   * @sets oThis.currentUserChannelRelations
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchCurrentUserChannelRelations() {
    const oThis = this;

    if (!CommonValidators.validateNonEmptyObject(oThis.currentUser)) {
      return;
    }

    const currentUserChannelRelationLibParams = {
      currentUserId: oThis.currentUser.id,
      channelIds: oThis.channelIds
    };

    const currentUserChannelRelationsResponse = await new GetCurrentUserChannelRelationsLib(
      currentUserChannelRelationLibParams
    ).perform();
    if (currentUserChannelRelationsResponse.isFailure()) {
      return Promise.reject(currentUserChannelRelationsResponse);
    }

    oThis.currentUserChannelRelations = currentUserChannelRelationsResponse.data.currentUserChannelRelations;
  }

  /**
   * Format response to be returned.
   *
   * @returns {*|result}
   * @private
   */
  async _formatResponse() {
    const oThis = this;

    const responseMetaData = await oThis._finalResponse();

    const response = {
      [entityTypeConstants.channelSearchList]: oThis.searchResults,
      [entityTypeConstants.channelsMap]: oThis.channels,
      [entityTypeConstants.channelDetailsMap]: oThis.channels,
      [entityTypeConstants.channelStatsMap]: oThis.channelStatsMap,
      [entityTypeConstants.currentUserChannelRelationsMap]: oThis.currentUserChannelRelations,
      [entityTypeConstants.channelIdToTagIdsMap]: oThis.channelIdToTagIdsMap,
      tags: oThis.tags,
      linkMap: oThis.links,
      textsMap: oThis.textsMap,
      imageMap: oThis.imageMap,
      meta: responseMetaData
    };

    return responseHelper.successWithData(response);
  }

  /**
   * Get meta.
   *
   * @returns {Promise<*>}
   * @private
   */
  async _finalResponse() {
    const oThis = this;

    const nextPagePayloadKey = {};

    if (oThis.nextPageNumber) {
      nextPagePayloadKey[paginationConstants.paginationIdentifierKey] = {
        page: oThis.nextPageNumber
      };
    }

    return {
      [paginationConstants.nextPagePayloadKey]: nextPagePayloadKey,
      search_term: oThis.channelPrefix,
      search_kind: 'channels',
      search_sub_kind: oThis._subKind(),
      search_in_all: await oThis._isSearchInAll()
    };
  }

  /**
   * It returns 1 if no channels are present otherwise 0.
   */
  async _isSearchInAll() {
    const oThis = this;

    if (oThis.currentPageNumber > 1 || oThis._subKind() == 'all' || !oThis._shouldSearch()) {
      return 0;
    }

    const params = {
      limit: 1,
      offset: 0,
      channelPrefix: oThis.channelPrefix
    };

    const response = await new ChannelModel().searchAllChannelsByPrefix(params);

    if (response.channelIds.length >= 1) {
      return 1;
    }

    return 0;
  }

  /**
   * Check if it is first page load req.
   *
   * @returns {number}
   * @private
   */
  _isFirstPage() {
    const oThis = this;

    return oThis.currentPageNumber === 1;
  }

  /**
   * Check if it is first page load req.
   *
   * @returns {number}
   * @private
   */
  _offset() {
    const oThis = this;

    return (oThis.currentPageNumber - 1) * oThis.limit;
  }

  /**
   * Set Channel Ids for current payload of search.
   *
   * @sets oThis.channelIds, oThis.nextPageNumber
   *
   * @returns {Promise<never>}
   * @private
   */
  async _setChannelIdsForSearch() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Return true if live channels should be shown on top.
   *
   * @returns {boolean}
   * @private
   */
  _showLiveChannelsOnTop() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Return Sub kind for meta.
   *
   * @returns {boolean}
   * @private
   */
  _subKind() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Get all Community Ids for this list.
   *
   * @sets oThis.allChannelIds
   *
   * @returns {Promise<never>}
   * @private
   */
  async _getAllChannelIds() {
    throw new Error('Sub-class to implement.');
  }
}

module.exports = ChannelListBase;
