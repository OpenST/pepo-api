const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  FetchAssociatedEntities = require(rootPrefix + '/lib/FetchAssociatedEntities'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  ChannelModel = require(rootPrefix + '/app/models/mysql/channel/Channel'),
  GetCurrentUserChannelRelationsLib = require(rootPrefix + '/lib/channel/GetCurrentUserChannelRelations'),
  ChannelTagByChannelIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelTagByChannelIds'),
  ChannelStatByChannelIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelStatByChannelIds'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  channelConstants = require(rootPrefix + '/lib/globalConstant/channel/channels');

// Declare variables.
const topChannelsResultsLimit = 5;

/**
 * Class to search channels.
 *
 * @class ChannelSearch
 */
class ChannelSearch extends ServiceBase {
  /**
   * Constructor to search channels.
   *
   * @param {object} params
   * @param {object} params.current_admin
   * @param {string} params.q
   * @param {string} params.pagination_identifier
   * @param {boolean} [params.getTopResults]
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.currentAdmin = params.current_admin;
    oThis.channelPrefix = params.q || null;
    oThis.paginationIdentifier = params[paginationConstants.paginationIdentifierKey] || null;
    oThis.getTopResults = params.getTopResults || false;

    oThis.limit = null;
    oThis.paginationTimestamp = null;
    oThis.nextPaginationTimestamp = null;
    oThis.channelIds = [];
    oThis.searchResults = [];
    oThis.channels = {};

    oThis.imageIds = [];
    oThis.textIds = [];

    oThis.channelIdToTagIdsMap = {};
    oThis.channelStatsMap = {};
    oThis.currentUserChannelRelations = {};
    oThis.imageMap = {};
    oThis.textData = {};
    oThis.includesData = {};
    oThis.tags = {};
    oThis.links = {};
    oThis.textsMap = {};
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

    const channelIds = await oThis._getChannelIds();

    await oThis._getChannels(channelIds);

    await oThis._fetchChannelTagIds();

    await Promise.all([
      oThis._fetchAssociatedEntities(),
      oThis._fetchChannelStats(),
      oThis._fetchCurrentUserChannelRelations()
    ]);

    return oThis._formatResponse();
  }

  /**
   * Validate and sanitize specific params.
   *
   * @sets oThis.channelPrefix, oThis.paginationTimestamp, oThis.limit
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    oThis.channelPrefix = basicHelper.filterSearchTerm(oThis.channelPrefix);

    if (oThis.paginationIdentifier) {
      const parsedPaginationParams = oThis._parsePaginationParams(oThis.paginationIdentifier);
      oThis.paginationTimestamp = parsedPaginationParams.paginationTimestamp; // Override paginationTimestamp
    } else {
      oThis.paginationTimestamp = null;
    }
    oThis.limit = paginationConstants.defaultChannelListPageSize;

    return oThis._validatePageSize();
  }

  /**
   * Get channel ids.
   *
   * @returns {Promise<*>}
   * @private
   */
  async _getChannelIds() {
    const oThis = this;

    let channelIds = [],
      searchQueryParams = {
        limit: oThis.limit,
        paginationTimestamp: oThis.paginationTimestamp,
        channelPrefix: oThis.channelPrefix,
        isAdminSearch: true
      };
    const channelSearchQueryRsp = await new ChannelModel({}).getChannelsByPrefix(searchQueryParams);

    channelIds = channelSearchQueryRsp.channelIds;

    return channelIds;
  }

  /**
   * Get channels.
   *
   * @sets oThis.channels, oThis.channelIds, oThis.imageIds, oThis.textIds, oThis.searchResults, oThis.nextPaginationTimestamp
   *
   * @param {array<number>} channelIds
   *
   * @returns {Promise<void>}
   * @private
   */
  async _getChannels(channelIds) {
    const oThis = this;

    if (channelIds.length === 0) {
      return;
    }

    const cacheResponse = await new ChannelByIdsCache({ ids: channelIds }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    oThis.channels = cacheResponse.data;

    for (let index = 0; index < channelIds.length; index++) {
      const channelId = channelIds[index],
        channel = oThis.channels[channelId];

      if (channel.status !== channelConstants.activeStatus) {
        continue;
      }

      oThis.channelIds.push(channelId);
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

      oThis.nextPaginationTimestamp = channel.createdAt;
    }
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

    const cacheResponse = await new ChannelStatByChannelIdsCache({ channelIds: oThis.channelIds }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    oThis.channelStatsMap = cacheResponse.data;

    for (const channelId in oThis.channelStatsMap) {
      const channelStat = oThis.channelStatsMap[channelId];
      if (!CommonValidators.validateNonEmptyObject(channelStat)) {
        return Promise.reject(
          responseHelper.error({
            internal_error_identifier: 'a_s_c_s_1',
            api_error_identifier: 'entity_not_found',
            debug_options: {
              channelId: channelId,
              channelStats: channelStat
            }
          })
        );
      }
    }
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

    const currentUserChannelRelationLibParams = {
      currentUserId: oThis.currentAdmin.id,
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
  _formatResponse() {
    const oThis = this;

    const responseMetaData = oThis._finalResponse();

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
  _finalResponse() {
    const oThis = this;

    const nextPagePayloadKey = {};

    if (oThis.channelIds.length >= oThis.limit && oThis.channelPrefix) {
      nextPagePayloadKey[paginationConstants.paginationIdentifierKey] = {
        pagination_timestamp: oThis.nextPaginationTimestamp
      };
    }

    return {
      [paginationConstants.nextPagePayloadKey]: nextPagePayloadKey,
      // Temp hardcoding, move to constants.
      search_term: oThis.channelPrefix,
      search_kind: 'channels'
    };
  }

  /**
   * Returns default page limit.
   *
   * @returns {number}
   * @private
   */
  _defaultPageLimit() {
    return paginationConstants.defaultChannelListPageSize;
  }

  /**
   * Returns minimum page limit.
   *
   * @returns {number}
   * @private
   */
  _minPageLimit() {
    return paginationConstants.minChannelListPageSize;
  }

  /**
   * Returns maximum page limit.
   *
   * @returns {number}
   * @private
   */
  _maxPageLimit() {
    return paginationConstants.maxChannelListPageSize;
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

module.exports = ChannelSearch;
