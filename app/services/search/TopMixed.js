const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserSearch = require(rootPrefix + '/app/services/search/UserSearch'),
  TagSearch = require(rootPrefix + '/app/services/search/TagSearch'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  responseEntity = require(rootPrefix + '/lib/globalConstant/responseEntityKey'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination');

/**
 * Class to get mixed top search results
 *
 * @class MixedTopSearch
 */
class MixedTopSearch extends ServiceBase {
  /**
   * Constructor to get mixed top search results
   *
   * @param {object} params
   * @param {string} params.q
   * @param {string} params.pagination_identifier
   * @param {Array} params.supported_entities
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.q = params.q || null;
    oThis.paginationIdentifier = params[paginationConstants.paginationIdentifierKey] || null;
    oThis.supportedEntities = params.supported_entities || ['user', 'tag'];

    oThis.searchEntities = [];
    oThis.tagResponses = null;
    oThis.userResponses = null;
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

    let promises = [];
    if (oThis.supportedEntities.includes('user')) {
      promises.push(oThis._getTopUserResults());
    }
    if (oThis.supportedEntities.includes('tag')) {
      promises.push(oThis._getTopTagResults());
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

    // This request cannot be paginated because it has mixed results
    // if (oThis.paginationIdentifier) {
    //   const parsedPaginationParams = oThis._parsePaginationParams(oThis.paginationIdentifier);
    //   oThis.page = parsedPaginationParams.page; // Override page
    // } else {
    //   oThis.page = 1;
    // }
    // oThis.limit = paginationConstants.defaultTagListPageSize;
    //
    // return oThis._validatePageSize();
  }

  /**
   * Get top user results
   *
   * @returns {Promise<void>}
   * @private
   */
  async _getTopUserResults() {
    const oThis = this;

    let resp = await new UserSearch({ q: oThis.q, getTopResults: true }).perform();

    oThis.userResponses = resp.data;
  }

  /**
   * Get top tag results
   *
   * @returns {Promise<void>}
   * @private
   */
  async _getTopTagResults() {
    const oThis = this;

    let resp = await new TagSearch({ q: oThis.q, getTopResults: true }).perform();

    oThis.tagResponses = resp.data;
  }

  _prepareResponse() {
    const oThis = this;

    let response = {
      [entityType.searchCategoriesList]: [],
      meta: {
        [paginationConstants.nextPagePayloadKey]: {}
      }
    };
    // If tag responses present then add in this result set
    if (oThis.tagResponses) {
      response[entityType.searchCategoriesList].push({
        id: 'sc_tr',
        updatedAt: Math.round(new Date() / 1000),
        kind: 'tag'
      });
      response.tagIds = oThis.tagResponses.tagIds;
      response.tagsMap = oThis.tagResponses.tagsMap;
    }

    // If user responses present then append those
    if (oThis.userResponses) {
      response[entityType.searchCategoriesList].push({
        id: 'sc_ur',
        updatedAt: Math.round(new Date() / 1000),
        kind: 'user'
      });
      response[entityType.userSearchList] = oThis.userResponses[entityType.userSearchList];
      response.usersByIdMap = oThis.userResponses.usersByIdMap;
      response.tokenUsersByUserIdMap = oThis.userResponses.tokenUsersByUserIdMap;
      response.imageMap = oThis.userResponses.imageMap;
    }

    return responseHelper.successWithData(response);
  }
}

module.exports = MixedTopSearch;
