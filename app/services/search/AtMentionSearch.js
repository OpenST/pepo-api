const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  TokenUserDetailByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination');

/**
 * Class for user at mention search.
 *
 * @class UserAtMentionSearch
 */
class UserAtMentionSearch extends ServiceBase {
  /**
   * Constructor for user at mention search.
   *
   * @param {object} params
   * @param {string} [params.q]
   * @param {Boolean} [params.getTopResults]
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.query = params.q || null;
    oThis.paginationIdentifier = params[paginationConstants.paginationIdentifierKey] || null;
    oThis.isOnlyNameSearch = true;

    oThis.limit = oThis._defaultPageLimit();

    oThis.userIds = [];
    oThis.imageIds = [];
    oThis.userDetails = {};
    oThis.imageDetails = {};
    oThis.tokenUsersByUserIdMap = {};
    oThis.searchResults = [];
    oThis.paginationTimestamp = null;
    oThis.nextPaginationTimestamp = null;
    oThis.hasNextPage = false;
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

    await oThis._fetchUserIds();

    await oThis._fetchTokenUsers();

    await oThis._filterNonActiveUsers();

    await oThis._prepareSearchResults();

    await oThis._addResponseMetaData();

    return oThis._prepareResponse();
  }

  /**
   * Validate and sanitize.
   *
   * @sets oThis.paginationTimestamp
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    oThis.query = basicHelper.filterSearchTerm(oThis.query);
    oThis.isOnlyNameSearch = !CommonValidators.validateUserName(oThis.query);

    oThis.query = oThis.query
      ? oThis.query
          .toLowerCase()
          .trim()
          .replace(/_/g, '\\_')
      : null;
    // Lowercase, trim and escape underscore.

    oThis.query = oThis.query && oThis.query.length > 0 ? oThis.query : null; // If query is empty string, make it as null.

    if (oThis.paginationIdentifier) {
      const parsedPaginationParams = oThis._parsePaginationParams(oThis.paginationIdentifier);

      oThis.paginationTimestamp = parsedPaginationParams.pagination_timestamp; // Override paginationTimestamp number.
    } else {
      oThis.paginationTimestamp = null;
    }

    // Validate limit.
    return oThis._validatePageSize();
  }

  /**
   * Fetch user ids.
   *
   * @sets oThis.userIds, oThis.userDetails
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchUserIds() {
    const oThis = this;

    let userData = {};

    if (oThis.query) {
      userData = await new UserModel().search({
        query: oThis.query,
        limit: oThis.limit,
        paginationTimestamp: oThis.paginationTimestamp,
        isOnlyNameSearch: oThis.isOnlyNameSearch,
        fetchAll: false
      });
      oThis.hasNextPage = userData.userIds.length >= oThis.limit;
    }

    oThis.userIds = userData.userIds;
    oThis.userDetails = userData.userDetails;
  }

  /**
   * Fetch token users.
   *
   * @sets oThis.tokenUsersByUserIdMap
   *
   * @return {Promise<*>}
   * @private
   */
  async _fetchTokenUsers() {
    const oThis = this;

    if (oThis.userIds.length === 0) {
      return;
    }

    const tokenUserRes = await new TokenUserDetailByUserIdsCache({ userIds: oThis.userIds }).fetch();

    if (tokenUserRes.isFailure()) {
      return Promise.reject(tokenUserRes);
    }

    oThis.tokenUsersByUserIdMap = tokenUserRes.data;
  }

  /**
   * Filter non active users - no platform activation.
   *
   * @return {Promise<void>}
   * @private
   */
  async _filterNonActiveUsers() {
    const oThis = this;

    for (let ind = 0; ind < oThis.userIds.length; ) {
      const userId = oThis.userIds[ind];
      if (oThis.tokenUsersByUserIdMap[userId].hasOwnProperty('userId')) {
        ind++; // Increment only if not deleted
      } else {
        oThis.userIds.splice(ind, 1);
        delete oThis.userDetails[userId];
        delete oThis.tokenUsersByUserIdMap[userId];
      }
    }
  }

  /**
   * Prepare search results.
   *
   * @sets oThis.searchResults, oThis.imageIds, oThis.nextPaginationTimestamp
   *
   * @returns {Promise<void>}
   * @private
   */
  async _prepareSearchResults() {
    const oThis = this;

    for (let ind = 0; ind < oThis.userIds.length; ind++) {
      const userId = oThis.userIds[ind];
      const userDetail = oThis.userDetails[userId];

      oThis.searchResults.push({
        id: ind,
        updatedAt: userDetail.updatedAt,
        text: userDetail.userName,
        status: userDetail.status,
        userId: userId
      });

      oThis.nextPaginationTimestamp = userDetail.createdAt;
    }
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

    if (oThis.hasNextPage) {
      nextPagePayloadKey[paginationConstants.paginationIdentifierKey] = {
        pagination_timestamp: oThis.nextPaginationTimestamp
      };
    }

    oThis.responseMetaData = {
      [paginationConstants.nextPagePayloadKey]: nextPagePayloadKey,
      // temp hardcoding, move to constants
      search_term: oThis.query,
      search_kind: 'users'
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

    const response = {
      usersByIdMap: oThis.userDetails,
      userIds: oThis.userIds,
      tokenUsersByUserIdMap: oThis.tokenUsersByUserIdMap,
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
    return paginationConstants.defaultUserSearchPageSize;
  }

  /**
   * Returns minimum page limit.
   *
   * @returns {number}
   * @private
   */
  _minPageLimit() {
    return paginationConstants.minUserSearchPageSize;
  }

  /**
   * Returns maximum page limit.
   *
   * @returns {number}
   * @private
   */
  _maxPageLimit() {
    return paginationConstants.maxUserSearchPageSize;
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

module.exports = UserAtMentionSearch;
