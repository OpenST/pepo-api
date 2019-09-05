const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  PreLaunchInviteModel = require(rootPrefix + '/app/models/mysql/PreLaunchInvite'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination');

/**
 * Class for invite user details by search
 *
 * @class InviteUserSearch
 */
class InviteUserSearch extends ServiceBase {
  /**
   * Constructor for invite user search details service.
   *
   * @param {object} params
   * @param {string} [params.q]
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.query = params.q ? params.q.toLowerCase() : null; // lower case
    oThis.query = oThis.query ? oThis.query.trim() : null; // trim spaces

    oThis.sortBy = oThis.sort_by;

    oThis.inviteIds = [];
    oThis.searchResults = [];
    oThis.pageNo = null;
    oThis.nextpageNo = null;
    oThis.paginationIdentifier = params[paginationConstants.paginationIdentifierKey] || null;
    oThis.limit = oThis._defaultPageLimit();
  }

  /**
   * Async perform.
   *
   * @return {Promise<void>}
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
   * @sets oThis.pageNo
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    if (oThis.paginationIdentifier) {
      const parsedPaginationParams = oThis._parsePaginationParams(oThis.paginationIdentifier);

      oThis.pageNo = parsedPaginationParams.page_no;
    } else {
      oThis.pageNo = null;
    }

    // Validate limit.
    return oThis._validatePageSize();
  }

  /**
   * Fetch user ids
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchInviteIds() {
    const oThis = this;

    let preLaunchInviteModelObj = new PreLaunchInviteModel({});

    let inviteData = await preLaunchInviteModelObj.search({
      query: oThis.query,
      limit: oThis.limit,
      pageNo: oThis.pageNo,
      sortBy: oThis.sortBy
    });

    oThis.inviteIds = inviteData.inviteIds;
    oThis.inviteDetails = inviteData.inviteDetails;
  }

  /**
   * Prepare search results
   *
   * @returns {Promise<void>}
   * @private
   */
  async _prepareSearchResults() {
    const oThis = this;

    for (let ind = 0; ind < oThis.inviteIds.length; ind++) {
      let inviteId = oThis.inviteIds[ind];
      let inviteDetail = oThis.inviteDetails[inviteId];

      oThis.searchResults.push({
        id: ind,
        updatedAt: inviteDetail.updatedAt,
        inviteId: inviteId
      });
    }

    oThis.nextpageNo = oThis.pageNo + 1;
  }

  /**
   * Add next page meta data.
   *
   * @sets oThis.responseMetaData
   *
   * @return {Result}
   * @private
   */
  _addResponseMetaData() {
    const oThis = this;

    const nextPagePayloadKey = {};

    if (oThis.searchResults.length >= oThis.limit) {
      nextPagePayloadKey[paginationConstants.paginationIdentifierKey] = {
        page_no: oThis.nextpageNo
      };
    }

    oThis.responseMetaData = {
      [paginationConstants.nextPagePayloadKey]: nextPagePayloadKey
    };

    return responseHelper.successWithData({});
  }

  /**
   * Prepare final response.
   *
   * @return {Promise<*|result>}
   * @private
   */
  async _prepareResponse() {
    const oThis = this;

    let response = {
      [entityType.inviteUserSearchList]: oThis.searchResults,
      [entityType.inviteMap]: oThis.inviteDetails,
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
