const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  TagByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/Tag'),
  ImageByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/ImageByIds'),
  TextsByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/TextsByIds'),
  ChannelByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelByIds'),
  TextIncludesByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TextIncludesByTextIds'),
  ChannelNamePaginationCache = require(rootPrefix + '/lib/cacheManagement/single/ChannelNamePagination'),
  CuratedEntityIdsByKindCache = require(rootPrefix + '/lib/cacheManagement/single/CuratedEntityIdsByKind'),
  ChannelTagByChannelIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelTagByChannelIds'),
  ChannelStatByChannelIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/channel/ChannelStatByChannelIds'),
  ChannelUserByUserIdAndChannelIdsCache = require(rootPrefix +
    '/lib/cacheManagement/multi/channel/ChannelUserByUserIdAndChannelIds'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  textConstants = require(rootPrefix + '/lib/globalConstant/text'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  curatedEntitiesConstants = require(rootPrefix + '/lib/globalConstant/curatedEntities'),
  channelUsersConstants = require(rootPrefix + '/lib/globalConstant/channel/channelUsers'),
  textIncludeConstants = require(rootPrefix + '/lib/globalConstant/cassandra/textInclude');

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
   * @param {Boolean} [params.getTopResults]
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
    oThis.linkIds = [];
    oThis.tagIds = [];

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

    await oThis._fetchTagAndLinksFromText();

    const promisesArray1 = [
      oThis._fetchTags(),
      oThis._fetchLinks(),
      oThis._fetchChannelStats(),
      oThis._fetchUserChannelRelations(),
      oThis._fetchImages()
    ];
    await Promise.all(promisesArray1);

    return oThis._formatResponse();
  }

  /**
   * Validate and sanitize specific params.
   *
   * @sets oThis.page, oThis.limit
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

    const channelsResponse = await new ChannelByIdsCache({ ids: oThis.channelIds }).fetch();

    oThis.channels = channelsResponse.data;

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

    const channelTagByChannelIdsCacheCacheData = cacheResponse.data;

    for (let channelId in channelTagByChannelIdsCacheCacheData) {
      const channelTags = channelTagByChannelIdsCacheCacheData[channelId];
      oThis.channelIdToTagIdsMap[channelId] = channelTags;
    }
  }

  /**
   * Fetch tag and links from texts
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchTagAndLinksFromText() {
    const oThis = this;

    if (oThis.textIds.length > 0) {
      const cacheRsp = await new TextsByIdCache({ ids: oThis.textIds }).fetch();
      if (cacheRsp.isFailure()) {
        return Promise.reject(cacheRsp);
      }

      oThis.textData = cacheRsp.data;

      const includesCacheRsp = await new TextIncludesByIdsCache({ ids: oThis.textIds }).fetch();
      if (includesCacheRsp.isFailure()) {
        return Promise.reject(includesCacheRsp);
      }

      oThis.includesData = includesCacheRsp.data;
    }

    const allTagIds = [],
      allLinkIds = [];
    for (const textId in oThis.includesData) {
      const textIncludes = oThis.includesData[textId];

      for (let ind = 0; ind < textIncludes.length; ind++) {
        const include = textIncludes[ind],
          entity = include.entityIdentifier.split('_');

        if (entity[0] == textIncludeConstants.tagEntityKindShort) {
          allTagIds.push(+entity[1]);
        } else if (
          entity[0] == textIncludeConstants.linkEntityKindShort &&
          (oThis.textData[textId].kind === textConstants.channelTaglineKind ||
            oThis.textData[textId].kind === textConstants.channelDescriptionKind)
        ) {
          allLinkIds.push(+entity[1]); // Inserting only channel tagline and channel description links, bio links are ignored
        }
      }
    }

    oThis.linkIds = [...new Set(oThis.linkIds.concat(allLinkIds))];
    oThis.tagIds = [...new Set(oThis.tagIds.concat(allTagIds))];
  }

  /**
   * Fetch tags if present.
   *
   * @sets oThis.tags
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchTags() {
    const oThis = this;

    if (oThis.tagIds.length <= 0) {
      return responseHelper.successWithData({});
    }

    const cacheRsp = await new TagByIdCache({ ids: oThis.tagIds }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    oThis.tags = cacheRsp.data;
  }

  /**
   * Fetch links if present.
   *
   * @sets oThis.links
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchLinks() {
    const oThis = this;

    if (oThis.linkIds.length <= 0) {
      return responseHelper.successWithData({});
    }

    const cacheRsp = await new UrlByIdCache({ ids: oThis.linkIds }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    oThis.links = cacheRsp.data;
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

    for (let channelId in oThis.channelStatsMap) {
      let channelStat = oThis.channelStatsMap[channelId];
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

    const userId = oThis.currentUser.id;
    const cacheResponse = await new ChannelUserByUserIdAndChannelIdsCache({
      userId: userId,
      channelIds: oThis.channelIds
    }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    const channelUserRelations = cacheResponse.data;

    for (let channelId in channelUserRelations) {
      oThis.currentUserChannelRelations[channelId] = {
        id: oThis.currentUser.id,
        isAdmin: 0,
        isMember: 0,
        notificationStatus: 0,
        updatedAt: 0
      };

      let channelUserRelation = channelUserRelations[channelId];
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
   * Fetch images.
   *
   * @sets oThis.imageMap
   *
   * @return {Promise<*>}
   * @private
   */
  async _fetchImages() {
    const oThis = this;

    if (oThis.imageIds.length < 1) {
      return;
    }

    const cacheRsp = await new ImageByIdCache({ ids: oThis.imageIds }).fetch();
    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    oThis.imageMap = cacheRsp.data;
  }

  /**
   * Format response to be returned.
   *
   * @returns {*|result}
   * @private
   */
  _formatResponse() {
    const oThis = this;

    oThis._formatTextResponse();
    const responseMetaData = oThis._finalResponse();

    const response = {
      channelIds: oThis.channelIds,
      [entityTypeConstants.channelsMap]: oThis.channels,
      [entityTypeConstants.channelDetailsMap]: oThis.channels,
      [entityTypeConstants.channelStatsMap]: oThis.channelStatsMap,
      [entityTypeConstants.currentUserChannelRelationsMap]: oThis.currentUserChannelRelations,
      [entityTypeConstants.channelIdToTagIdsMap]: oThis.channelIdToTagIdsMap,
      tags: oThis.tags,
      links: oThis.links,
      textsMap: oThis.textsMap,
      imageMap: oThis.imageMap,
      meta: responseMetaData
    };

    console.log('The response is : ', response);

    return responseHelper.successWithData(response);
  }

  /**
   * Format text response to be sent.
   *
   * @private
   */
  _formatTextResponse() {
    const oThis = this;

    for (const textId in oThis.textData) {
      const textIncludes = oThis.includesData[textId],
        tagIds = [],
        linkIds = [],
        tagIdsToReplaceableTagNameMap = {};

      // Fetch link id and tag ids
      for (let ind = 0; ind < textIncludes.length; ind++) {
        const includeRow = textIncludes[ind],
          entity = includeRow.entityIdentifier.split('_');

        if (entity[0] === textIncludeConstants.tagEntityKindShort) {
          tagIds.push(+entity[1]);
          tagIdsToReplaceableTagNameMap[+entity[1]] = includeRow.replaceableText;
        } else if (entity[0] === textIncludeConstants.linkEntityKindShort) {
          linkIds.push(+entity[1]);
        }
      }

      const formatTextParams = {
        textId: textId,
        tagIds: tagIds,
        linkIds: linkIds,
        tagIdToTagNameMap: tagIdsToReplaceableTagNameMap
      };
      const textIncludesData = oThis._formatIncludesDataInText(formatTextParams);
      if (textIncludesData) {
        oThis.textsMap[textId] = textIncludesData;
      }
    }
  }

  /**
   *  Format tags, links and at mentions present in text.
   *
   * @returns {{includes: {}, text: *}}
   * @private
   */
  _formatIncludesDataInText(params) {
    const oThis = this;

    if (oThis.textData[params.textId] && oThis.textData[params.textId].text) {
      const textData = {
        text: oThis.textData[params.textId].text,
        includes: {}
      };

      if (params.tagIds) {
        for (let ind = 0; ind < params.tagIds.length; ind++) {
          const tagId = params.tagIds[ind],
            tagDetail = oThis.tags[tagId],
            tagName = params.tagIdToTagNameMap[tagId];

          textData.includes[tagName] = {
            kind: 'tags',
            id: tagDetail.id
          };
        }
      }

      if (params.linkIds) {
        for (let ind = 0; ind < params.linkIds.length; ind++) {
          const linkId = params.linkIds[ind];

          textData.includes[oThis.links[linkId].url] = {
            kind: 'links',
            id: linkId
          };
        }
      }

      return textData;
    }

    return null;
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
