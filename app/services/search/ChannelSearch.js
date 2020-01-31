const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  FetchAssociatedEntities = require(rootPrefix + '/lib/FetchAssociatedEntities'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  ChannelNamePaginationCache = require(rootPrefix + '/lib/cacheManagement/single/ChannelNamePagination'),
  CuratedEntityIdsByKindCache = require(rootPrefix + '/lib/cacheManagement/single/CuratedEntityIdsByKind'),
  ChannelTagByChannelIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelTagByChannelIds'),
  ChannelStatByChannelIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelStatByChannelIds'),
  ChannelUserByUserIdAndChannelIdsCache = require(rootPrefix +
    '/lib/cacheManagement/multi/channel/ChannelUserByUserIdAndChannelIds'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  curatedEntitiesConstants = require(rootPrefix + '/lib/globalConstant/curatedEntities'),
  channelUsersConstants = require(rootPrefix + '/lib/globalConstant/channel/channelUsers');

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
    oThis.page = null;
    oThis.channelIds = [];
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

    await oThis._getChannelIds();

    const promisesArray = [oThis._getChannels(), oThis._fetchChannelTagIds()];

    await Promise.all(promisesArray);

    await Promise.all([
      oThis._fetchAssociatedEntities(),
      oThis._fetchChannelStats(),
      oThis._fetchUserChannelRelations()
    ]);

    return oThis._formatResponse();
  }

  /**
   * Validate and sanitize specific params.
   *
   * @sets oThis.channelPrefix, oThis.page, oThis.limit
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    oThis.channelPrefix = basicHelper.filterSearchTerm(oThis.channelPrefix);

    if (oThis.paginationIdentifier) {
      const parsedPaginationParams = oThis._parsePaginationParams(oThis.paginationIdentifier);
      oThis.page = parsedPaginationParams.page; // Override page
    } else {
      oThis.page = 1;
    }
    oThis.limit = paginationConstants.defaultChannelListPageSize;

    return oThis._validatePageSize();
  }

  /**
   * Get channel ids.
   *
   * @sets oThis.channelIds
   *
   * @returns {Promise<void>}
   * @private
   */
  async _getChannelIds() {
    const oThis = this;

    // TODO: channels, set only active channels in oThis.channelIds and oThis.channels
    if (oThis.channelPrefix) {
      const channelPaginationRsp = await new ChannelNamePaginationCache({
        limit: oThis.limit,
        page: oThis.page,
        channelPrefix: oThis.channelPrefix
      }).fetch();

      oThis.channelIds = channelPaginationRsp.data.channelIds;
    } else {
      // Display curated channels in search.
      const cacheResponse = await new CuratedEntityIdsByKindCache({
        entityKind: curatedEntitiesConstants.channelsEntityKind
      }).fetch();
      if (cacheResponse.isFailure()) {
        return Promise.reject(cacheResponse);
      }

      let channelIds = cacheResponse.data.entityIds;

      channelIds = oThis.getTopResults ? channelIds.slice(0, topChannelsResultsLimit + 1) : channelIds;

      if (channelIds.length > 0) {
        oThis.channelIds = channelIds;
      }
    }
  }

  /**
   * Get channels.
   *
   * @sets oThis.channels, oThis.imageIds, oThis.textIds
   *
   * @returns {Promise<void>}
   * @private
   */
  async _getChannels() {
    const oThis = this;

    if (oThis.channelIds.length === 0) {
      return;
    }

    const cacheResponse = await new ChannelByIdsCache({ ids: oThis.channelIds }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    oThis.channels = cacheResponse.data;

    // TODO: Channels, only active channels needs to be sent outside.
    for (const channelId in oThis.channels) {
      const channel = oThis.channels[channelId];
      if (channel.coverImageId) {
        oThis.imageIds.push(channel.coverImageId);
      }

      if (channel.descriptionId) {
        oThis.textIds.push(channel.descriptionId);
      }

      if (channel.taglineId) {
        oThis.textIds.push(channel.taglineId);
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
  async _fetchUserChannelRelations() {
    const oThis = this;

    // TODO: Channels, use current user relations lib
    const userId = oThis.currentUser.id;
    const cacheResponse = await new ChannelUserByUserIdAndChannelIdsCache({
      userId: userId,
      channelIds: oThis.channelIds
    }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    const channelUserRelations = cacheResponse.data;

    for (const channelId in channelUserRelations) {
      oThis.currentUserChannelRelations[channelId] = {
        id: oThis.currentUser.id,
        isAdmin: 0,
        isMember: 0,
        notificationStatus: 0,
        updatedAt: Math.round(new Date() / 1000)
      };

      const channelUserRelation = channelUserRelations[channelId];
      if (
        CommonValidators.validateNonEmptyObject(channelUserRelation) &&
        channelUserRelation.status === channelUsersConstants.activeStatus
      ) {
        oThis.currentUserChannelRelations[channelId] = {
          id: oThis.currentUser.id,
          isAdmin: Number(channelUserRelation.role === channelUsersConstants.adminRole),
          isMember: 1,
          notificationStatus: Number(
            channelUserRelation.notificationStatus === channelUsersConstants.activeNotificationStatus
          ),
          updatedAt: channelUserRelation.updatedAt
        };
      }
    }
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

    //TODO: Channels, send channels list instead of seperate channel ids and map
    const response = {
      channelIds: oThis.channelIds,
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
        page: oThis.page + 1
      };
    }

    return {
      [paginationConstants.nextPagePayloadKey]: nextPagePayloadKey,
      // temp hardcoding, move to constants.
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
