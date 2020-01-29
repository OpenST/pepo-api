const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  PreLaunchInviteModel = require(rootPrefix + '/app/models/mysql/PreLaunchInvite'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination'),
  preLaunchInviteConstants = require(rootPrefix + '/lib/globalConstant/preLaunchInvite');

/**
 * Class for invite user details by search.
 *
 * @class InviteUserSearch
 */
class InviteUserSearch extends ServiceBase {
  /**
   * Constructor for invite user search details service.
   *
   * @param {object} params
   * @param {string} [params.q]
   * @param {string} [params.sort_by]
   * @param {string} [params.pagination_identifier]
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.query = params.q || null;
    oThis.sortBy = params.sort_by || null;
    oThis.paginationIdentifier = params[paginationConstants.paginationIdentifierKey] || null;

    oThis.inviteIds = [];
    oThis.searchResults = [];
    oThis.pageNo = null;
    oThis.nextPageNo = null;
    oThis.limit = oThis._defaultPageLimit();
    oThis.totalCount = 0;
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

    await oThis._fetchInviteIds();

    await oThis._prepareSearchResults();

    await oThis._addResponseMetaData();

    return oThis._prepareResponse();
  }

  /**
   * Validate and sanitize.
   *
   * @sets oThis.query, oThis.sortBy, oThis.pageNo
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    oThis.query = oThis.query ? oThis.query.toLowerCase().trim() : null; // Lowercase and trim spaces.
    oThis.sortBy = oThis.sortBy ? oThis.sortBy.toLowerCase() : preLaunchInviteConstants.descendingSortByValue;

    if (!preLaunchInviteConstants.sortByValuesMap[oThis.sortBy]) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_a_pl_us_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_sort_by'],
          debug_options: { transfers: oThis.transfersData }
        })
      );
    }

    if (oThis.paginationIdentifier) {
      const parsedPaginationParams = oThis._parsePaginationParams(oThis.paginationIdentifier);

      oThis.pageNo = parsedPaginationParams.page_no;
    } else {
      oThis.pageNo = 1;
    }

    // Validate limit.
    return oThis._validatePageSize();
  }

  /**
   * Fetch user ids.
   *
   * @sets oThis.inviteIds, oThis.inviteDetails
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchInviteIds() {
    const oThis = this;

    const inviteData = await new PreLaunchInviteModel().search({
      query: oThis.query,
      limit: oThis.limit,
      pageNo: oThis.pageNo,
      sortBy: oThis.sortBy
    });

    oThis.inviteIds = inviteData.inviteIds;
    oThis.inviteDetails = inviteData.inviteDetails;

    const totalCountResp = await new PreLaunchInviteModel().totalCount({
      query: oThis.query
    });

    oThis.totalCount = totalCountResp.totalCount || 0;
  }

  /**
   * Prepare search results.
   *
   * @sets oThis.searchResults, oThis.nextPageNo
   *
   * @returns {Promise<void>}
   * @private
   */
  async _prepareSearchResults() {
    const oThis = this;

    for (let ind = 0; ind < oThis.inviteIds.length; ind++) {
      const inviteId = oThis.inviteIds[ind];
      const inviteDetail = oThis.inviteDetails[inviteId];

      oThis.searchResults.push({
        id: ind,
        updatedAt: inviteDetail.updatedAt,
        inviteId: inviteId
      });
    }

    oThis.nextPageNo = oThis.pageNo + 1;
  }

  /**
   * Add next page meta data.
   *
   * @sets oThis.responseMetaData
   *
   * @returns {result}
   * @private
   */
  _addResponseMetaData() {
    const oThis = this;

    const nextPagePayloadKey = {};

    if (oThis.searchResults.length >= oThis.limit) {
      nextPagePayloadKey[paginationConstants.paginationIdentifierKey] = {
        page_no: oThis.nextPageNo
      };
    }

    oThis.responseMetaData = {
      [paginationConstants.nextPagePayloadKey]: nextPagePayloadKey,
      [paginationConstants.totalNoKey]: oThis.totalCount
    };
  }

  /**
   * Prepare final response.
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _prepareResponse() {
    const oThis = this;

    const response = {
      [entityTypeConstants.inviteUserSearchList]: oThis.searchResults,
      [entityTypeConstants.inviteMap]: oThis.inviteDetails,
      meta: oThis.responseMetaData
    };

    return responseHelper.successWithData(response);
  }

  /**
   * Returns default page limit.
   *
   * @returns {number}
   * @private
   */
  _defaultPageLimit() {
    return paginationConstants.defaultInviteUserSearchPageSize;
  }

  /**
   * Returns minimum page limit.
   *
   * @returns {number}
   * @private
   */
  _minPageLimit() {
    return paginationConstants.minInviteUserSearchPageSize;
  }

  /**
   * Returns maximum page limit.
   *
   * @returns {number}
   * @private
   */
  _maxPageLimit() {
    return paginationConstants.maxInviteUserSearchPageSize;
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

module.exports = InviteUserSearch;
