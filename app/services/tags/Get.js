const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  TagMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/Tag'),
  TagPaginationCache = require(rootPrefix + '/lib/cacheManagement/single/TagPagination'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  pagination = require(rootPrefix + '/lib/globalConstant/pagination');

class GetTags extends ServiceBase {
  /**
   * @param {object} params
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.tagPrefix = params.tag;

    oThis.paginationIdentifier = params[pagination.paginationIdentifierKey] || null;
    oThis.limit = null;
    oThis.page = null;
  }

  /**
   * Async performer.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    await oThis._getTagIds();

    await oThis._getTags();

    return oThis.finalResponse();
  }

  /**
   * Validate and sanitize specific params
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    if (oThis.paginationIdentifier) {
      let parsedPaginationParams = oThis._parsePaginationParams(oThis.paginationIdentifier);
      oThis.page = parsedPaginationParams.page; //override page
    } else {
      oThis.page = 1;
    }
    oThis.limit = pagination.defaultTagListPageSize;

    return await oThis._validatePageSize();
  }

  /**
   *
   * @returns {Promise<void>}
   * @private
   */
  async _getTagIds() {
    const oThis = this;

    const tagPaginationRsp = await new TagPaginationCache({
      limit: oThis.limit,
      page: oThis.page,
      tagPrefix: oThis.tagPrefix
    }).fetch();

    oThis.tagIds = tagPaginationRsp.data;
  }

  /**
   * Get tags.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _getTags() {
    const oThis = this;

    const tagsResponse = await new TagMultiCache({ ids: oThis.tagIds }).fetch();

    oThis.tags = tagsResponse.data;
  }

  /**
   * Service Response
   *
   * @returns {Promise<*>}
   * @private
   */
  finalResponse() {
    const oThis = this;

    let nextPagePayloadKey = {},
      limit = oThis.limit;

    if (oThis.tagIds.length == limit) {
      nextPagePayloadKey[pagination.paginationIdentifierKey] = {
        page: oThis.page + 1
      };
    }

    let responseMetaData = {
      [pagination.nextPagePayloadKey]: nextPagePayloadKey
    };

    return responseHelper.successWithData({
      tags: oThis.tags,
      meta: responseMetaData
    });
  }

  /**
   * Default Page Limit.
   *
   * @private
   */
  _defaultPageLimit() {
    return pagination.defaultTagListPageSize;
  }

  /**
   * Min page limit.
   *
   * @private
   */
  _minPageLimit() {
    return pagination.minTagListPageSize;
  }

  /**
   * Max page limit.
   *
   * @private
   */
  _maxPageLimit() {
    return pagination.maxTagListPageSize;
  }

  /**
   * Current page limit.
   *
   * @private
   */
  _currentPageLimit() {
    const oThis = this;

    return oThis.limit;
  }
}

module.exports = GetTags;
