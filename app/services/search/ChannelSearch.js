const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  FetchAssociatedEntities = require(rootPrefix + '/lib/FetchAssociatedEntities'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  ChannelNamePaginationCache = require(rootPrefix + '/lib/cacheManagement/single/ChannelNamePagination'),
  GetCurrentUserChannelRelationsLib = require(rootPrefix + '/lib/channel/GetCurrentUserChannelRelations'),
  CuratedEntityIdsByKindCache = require(rootPrefix + '/lib/cacheManagement/single/CuratedEntityIdsByKind'),
  ChannelTagByChannelIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelTagByChannelIds'),
  ChannelStatByChannelIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelStatByChannelIds'),
  DefaultChannelsListForWeb = require(rootPrefix + '/lib/cacheManagement/single/DefaultChannelsListForWeb'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  channelConstants = require(rootPrefix + '/lib/globalConstant/channel/channels'),
  apiSourceConstants = require(rootPrefix + '/lib/globalConstant/apiSource'),
  curatedEntitiesConstants = require(rootPrefix + '/lib/globalConstant/curatedEntities');

// Declare variables.
const topChannelsResultsLimit = 5,
  searchTermMaxLength = 200; // This is to ensure that cache key max is not violated.

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
   * @param {object} params.current_user
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

    oThis.currentUser = params.current_user;
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
    oThis.nextPageChannelIdIndex = 0;
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
      oThis.paginationTimestamp = parsedPaginationParams.pagination_timestamp; // Override paginationTimestamp
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

    let channelIds = [];

    // Length check is added to ensure that empty data is returned in case of invalid channel name.
    if (oThis.channelPrefix) {
      if (oThis.channelPrefix.length <= searchTermMaxLength) {
        const channelPaginationRsp = await new ChannelNamePaginationCache({
          limit: oThis.limit,
          paginationTimestamp: oThis.paginationTimestamp,
          channelPrefix: oThis.channelPrefix
        }).fetch();

        channelIds = channelPaginationRsp.data.channelIds;
      }
    } else {
      // Order all channels, first Live, then curated, then rest all
      const cacheResponse = await new DefaultChannelsListForWeb().fetch();
      if (cacheResponse.isFailure()) {
        return Promise.reject(cacheResponse);
      }

      const allchannelIds = cacheResponse.data.channelIds;
      let index = oThis.paginationTimestamp ? oThis.paginationTimestamp : 0;
      channelIds = allchannelIds.slice(index, index + oThis.limit);
      if (index + oThis.limit < allchannelIds.length) {
        oThis.nextPageChannelIdIndex = index + oThis.limit;
      }
    }

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

      if (channel.status === channelConstants.activeStatus) {
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
      } else {
        delete oThis.channels[channelId];
      }
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

    if (!oThis.currentUser) {
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
    } else if (oThis.nextPageChannelIdIndex) {
      nextPagePayloadKey[paginationConstants.paginationIdentifierKey] = {
        pagination_timestamp: oThis.nextPageChannelIdIndex
      };
    }

    return {
      [paginationConstants.nextPagePayloadKey]: nextPagePayloadKey,
      // Temp hardcoding, move to constants.
      search_term: oThis.channelPrefix,
      search_kind: 'communities'
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
