const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  TagMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/Tag'),
  TagPaginationCache = require(rootPrefix + '/lib/cacheManagement/single/TagPagination'),
  CuratedEntityIdsByKindCache = require(rootPrefix + '/lib/cacheManagement/single/CuratedEntityIdsByKind'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  tagConstants = require(rootPrefix + '/lib/globalConstant/tag'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination'),
  curatedEntitiesConstants = require(rootPrefix + '/lib/globalConstant/curatedEntities');

// Declare variables.
const topTagsResultsLimit = 5;

/**
 * Class to search tags.
 *
 * @class TagSearch
 */
class TagSearch extends ServiceBase {
  /**
   * Constructor to get tags.
   *
   * @param {object} params
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

    oThis.tagPrefix = params.q || null;
    oThis.paginationIdentifier = params[paginationConstants.paginationIdentifierKey] || null;
    oThis.getTopResults = params.getTopResults || false;

    oThis.limit = null;
    oThis.page = null;
    oThis.tagIds = [];
    oThis.tags = {};
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

    await oThis._getTagIds();

    await oThis._getTags();

    const responseMetaData = oThis._finalResponse();

    return responseHelper.successWithData({
      tagIds: oThis.tagIds,
      tagsMap: oThis.tags,
      meta: responseMetaData
    });
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

    oThis.tagPrefix = basicHelper.filterSearchTerm(oThis.tagPrefix);

    if (oThis.paginationIdentifier) {
      const parsedPaginationParams = oThis._parsePaginationParams(oThis.paginationIdentifier);
      oThis.page = parsedPaginationParams.page; // Override page
    } else {
      oThis.page = 1;
    }
    oThis.limit = paginationConstants.defaultTagListPageSize;

    return oThis._validatePageSize();
  }

  /**
   * Get tag ids.
   *
   * @sets oThis.tagIds
   *
   * @returns {Promise<void>}
   * @private
   */
  async _getTagIds() {
    const oThis = this;

    // Length check is added to ensure that empty data is returned in case of invalid tag name.
    if (oThis.tagPrefix) {
      if (oThis.tagPrefix.length <= tagConstants.maxTagLength) {
        const tagPaginationRsp = await new TagPaginationCache({
          limit: oThis.limit,
          page: oThis.page,
          tagPrefix: oThis.tagPrefix
        }).fetch();

        oThis.tagIds = tagPaginationRsp.data;
      }
    } else {
      // Display curated tags in search.
      const cacheResponse = await new CuratedEntityIdsByKindCache({
        entityKind: curatedEntitiesConstants.tagsEntityKind
      }).fetch();
      if (cacheResponse.isFailure()) {
        return Promise.reject(cacheResponse);
      }

      let tagIds = cacheResponse.data.entityIds;

      tagIds = oThis.getTopResults ? tagIds.slice(0, topTagsResultsLimit + 1) : tagIds;

      if (tagIds.length > 0) {
        oThis.tagIds = tagIds;
      }
    }
  }

  /**
   * Get tags.
   *
   * @sets oThis.tags
   *
   * @returns {Promise<void>}
   * @private
   */
  async _getTags() {
    const oThis = this;

    if (oThis.tagIds.length === 0) {
      return;
    }

    const tagsResponse = await new TagMultiCache({ ids: oThis.tagIds }).fetch();

    oThis.tags = tagsResponse.data;
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

    if (oThis.tagIds.length >= oThis.limit && oThis.tagPrefix) {
      nextPagePayloadKey[paginationConstants.paginationIdentifierKey] = {
        page: oThis.page + 1
      };
    }

    return {
      [paginationConstants.nextPagePayloadKey]: nextPagePayloadKey,
      // temp hardcoding, move to constants.
      search_term: oThis.tagPrefix,
      search_kind: 'tags'
    };
  }

  /**
   * Returns default page limit.
   *
   * @returns {number}
   * @private
   */
  _defaultPageLimit() {
    return paginationConstants.defaultTagListPageSize;
  }

  /**
   * Returns minimum page limit.
   *
   * @returns {number}
   * @private
   */
  _minPageLimit() {
    return paginationConstants.minTagListPageSize;
  }

  /**
   * Returns maximum page limit.
   *
   * @returns {number}
   * @private
   */
  _maxPageLimit() {
    return paginationConstants.maxTagListPageSize;
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

module.exports = TagSearch;
