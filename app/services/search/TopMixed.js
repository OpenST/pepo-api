const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  TagSearch = require(rootPrefix + '/app/services/search/TagSearch'),
  UserSearch = require(rootPrefix + '/app/services/search/UserSearch'),
  ChannelSearch = require(rootPrefix + '/app/services/search/ChannelSearch'),
  AllChannelList = require(rootPrefix + 'app/services/channel/list/All'),
  TrendingChannelList = require(rootPrefix + 'app/services/channel/list/Trending'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination');

/**
 * Class to get mixed top search results.
 *
 * @class MixedTopSearch
 */
class MixedTopSearch extends ServiceBase {
  /**
   * Constructor to get mixed top search results.
   *
   * @param {object} params
   * @param {object} params.current_user
   * @param {string} params.q
   * @param {string} params.pagination_identifier
   * @param {array<string>} params.supported_entities
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.currentUser = params.current_user;
    oThis.q = params.q || null;
    oThis.paginationIdentifier = params[paginationConstants.paginationIdentifierKey] || null;
    oThis.supportedEntities = params.supported_entities || ['user', 'tag', 'channel'];

    oThis.searchEntities = [];
    oThis.tagResponses = null;
    oThis.userResponses = null;
    oThis.channelResponses = null;
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

    const promises = [];
    if (oThis.supportedEntities.includes('user')) {
      promises.push(oThis._getTopUserResults());
    }
    if (oThis.supportedEntities.includes('tag')) {
      promises.push(oThis._getTopTagResults());
    }
    if (oThis.supportedEntities.includes('channel')) {
      promises.push(oThis._getTopChannelResults());
    }
    await Promise.all(promises);

    return oThis._prepareResponse();
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

    oThis.q = basicHelper.filterSearchTerm(oThis.q);

    /*
    This request cannot be paginated because it has mixed results.

    if (oThis.paginationIdentifier) {
      const parsedPaginationParams = oThis._parsePaginationParams(oThis.paginationIdentifier);
      oThis.page = parsedPaginationParams.page; // Override page
    } else {
      oThis.page = 1;
    }
    oThis.limit = paginationConstants.defaultTagListPageSize;

    return oThis._validatePageSize();
     */
  }

  /**
   * Get top user results.
   *
   * @sets oThis.userResponses
   *
   * @returns {Promise<void>}
   * @private
   */
  async _getTopUserResults() {
    const oThis = this;

    const resp = await new UserSearch({ q: oThis.q, getTopResults: true }).perform();

    oThis.userResponses = resp.data;
  }

  /**
   * Get top tag results.
   *
   * @sets oThis.tagResponses
   *
   * @returns {Promise<void>}
   * @private
   */
  async _getTopTagResults() {
    const oThis = this;

    const resp = await new TagSearch({ q: oThis.q, getTopResults: true }).perform();

    oThis.tagResponses = resp.data;
  }

  /**
   * Get top channel results.
   *
   * @sets oThis.channelResponses
   *
   * @returns {Promise<void>}
   * @private
   */
  async _getTopChannelResults() {
    const oThis = this;

    let resp = null;

    const params = {
      current_user: oThis.currentUser,
      q: oThis.q
    };

    if (!CommonValidators.validateNonBlankString(oThis.q)) {
      resp = new TrendingChannelList(params).perform();
    } else {
      resp = new AllChannelList(params).perform();
    }

    oThis.channelResponses = resp.data;
  }

  /**
   * Prepare service response.
   *
   * @returns {*|result}
   * @private
   */
  _prepareResponse() {
    const oThis = this;

    const response = {
      [entityTypeConstants.channelsMap]: {},
      [entityTypeConstants.channelDetailsMap]: {},
      [entityTypeConstants.channelStatsMap]: {},
      [entityTypeConstants.currentUserChannelRelationsMap]: {},
      [entityTypeConstants.channelIdToTagIdsMap]: {},
      tags: {},
      linkMap: {},
      textsMap: {},
      imageMap: {},
      tagIds: [],
      tagsMap: {},
      [entityTypeConstants.userSearchList]: [],
      usersByIdMap: {},
      tokenUsersByUserIdMap: {},
      [entityTypeConstants.searchCategoriesList]: [],
      meta: {
        [paginationConstants.nextPagePayloadKey]: {},
        supportedEntities: oThis.supportedEntities
      }
    };

    // If channel responses present then append those.
    if (oThis.channelResponses) {
      response[entityTypeConstants.searchCategoriesList].push({
        id: 'sc_cr',
        updatedAt: Math.round(new Date() / 1000),
        kind: 'channel',
        title: oThis.q ? 'Channel' : null
      });

      response[entityTypeConstants.channelSearchList] = oThis.channelResponses[entityTypeConstants.channelSearchList];
      response[entityTypeConstants.channelsMap] = oThis.channelResponses[entityTypeConstants.channelsMap];
      response[entityTypeConstants.channelDetailsMap] = oThis.channelResponses[entityTypeConstants.channelDetailsMap];
      response[entityTypeConstants.channelStatsMap] = oThis.channelResponses[entityTypeConstants.channelStatsMap];
      response[entityTypeConstants.currentUserChannelRelationsMap] =
        oThis.channelResponses[entityTypeConstants.currentUserChannelRelationsMap];
      response[entityTypeConstants.channelIdToTagIdsMap] =
        oThis.channelResponses[entityTypeConstants.channelIdToTagIdsMap];
      response.tags = oThis.channelResponses.tags;
      response.linkMap = oThis.channelResponses.linkMap;
      response.textsMap = oThis.channelResponses.textsMap;
      response.imageMap = oThis.channelResponses.imageMap;
    }

    // If user responses present then append those.
    if (oThis.userResponses) {
      response[entityTypeConstants.searchCategoriesList].push({
        id: 'sc_ur',
        updatedAt: Math.round(new Date() / 1000),
        kind: 'user',
        title: oThis.q ? 'People' : null
      });
      response[entityTypeConstants.userSearchList] = oThis.userResponses[entityTypeConstants.userSearchList];
      response.usersByIdMap = oThis.userResponses.usersByIdMap;
      response.tokenUsersByUserIdMap = oThis.userResponses.tokenUsersByUserIdMap;
      Object.assign(response.imageMap, oThis.userResponses.imageMap);
    }

    // If tag responses present then add in this result set.
    if (oThis.tagResponses) {
      response[entityTypeConstants.searchCategoriesList].push({
        id: 'sc_tr',
        updatedAt: Math.round(new Date() / 1000),
        kind: 'tag',
        title: oThis.q ? 'Tags' : null
      });
      response.tagIds = oThis.tagResponses.tagIds;
      response.tagsMap = oThis.tagResponses.tagsMap;
    }

    return responseHelper.successWithData(response);
  }
}

module.exports = MixedTopSearch;
