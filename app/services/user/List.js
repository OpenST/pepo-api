const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserPaginationCache = require(rootPrefix + '/lib/cacheManagement/single/UserPagination'),
  UserMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  TokenUserByUserIdsMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
  pagination = require(rootPrefix + '/lib/globalConstant/pagination'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for User List
 *
 * @class
 */
class UserList extends ServiceBase {
  /**
   * Constructor for user list
   *
   * @param params
   *
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.currentUserId = params.current_user.id;
    oThis.paginationIdentifier = params[pagination.paginationIdentifierKey] || null;

    oThis.limit = null;
    oThis.page = null;
    oThis.userIds = [];
    oThis.usersByIdHash = {};
    oThis.tokenUsersByUserIdHash = {};
    oThis.currentUserRemoved = false;
  }

  /**
   * Async Perform
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    await oThis._fetchPaginatedUserIdsFromCache();

    oThis._removeCurrentUserFromResponse();

    if (oThis.userIds.length === 0) {
      return responseHelper.successWithData(oThis.finalResponse());
    }

    await oThis._fetchUsers();

    await oThis._fetchTokenUsers();

    return responseHelper.successWithData(oThis.finalResponse());
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
    oThis.limit = pagination.defaultUserListPageSize;

    return await oThis._validatePageSize();
  }

  /**
   * Fetch token user details from cache
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchPaginatedUserIdsFromCache() {
    const oThis = this;

    const UserPaginationCacheObj = new UserPaginationCache({
        limit: oThis.limit,
        page: oThis.page
      }),
      userPaginationCacheRes = await UserPaginationCacheObj.fetch();

    if (userPaginationCacheRes.isFailure()) {
      return Promise.reject(userPaginationCacheRes);
    }

    oThis.userIds = userPaginationCacheRes.data;

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * remove current user from final response
   *
   * @private
   */
  _removeCurrentUserFromResponse() {
    const oThis = this;

    const index = oThis.userIds.indexOf(oThis.currentUserId);

    if (index > -1) {
      oThis.userIds.splice(index, 1);
      oThis.currentUserRemoved = true;
    }
    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Fetch users from cache
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchUsers() {
    const oThis = this;

    let usersByIdHashRes = await new UserMultiCache({ ids: oThis.userIds }).fetch();

    if (usersByIdHashRes.isFailure()) {
      return Promise.reject(usersByIdHashRes);
    }

    oThis.usersByIdHash = usersByIdHashRes.data;

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Fetch token user details from cache
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchTokenUsers() {
    const oThis = this;

    let tokenUsersByIdHashRes = await new TokenUserByUserIdsMultiCache({ userIds: oThis.userIds }).fetch();

    if (tokenUsersByIdHashRes.isFailure()) {
      return Promise.reject(tokenUsersByIdHashRes);
    }

    oThis.tokenUsersByUserIdHash = tokenUsersByIdHashRes.data;

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Service Response
   *
   * @returns {Promise<void>}
   * @private
   */
  finalResponse() {
    const oThis = this;

    let nextPagePayloadKey = {},
      limit = oThis.limit;

    if (oThis.currentUserRemoved) {
      limit = limit - 1;
    }

    if (oThis.userIds.length == limit) {
      nextPagePayloadKey[pagination.paginationIdentifierKey] = {
        page: oThis.page + 1
      };
    }

    let responseMetaData = {
      [pagination.nextPagePayloadKey]: nextPagePayloadKey
    };

    let userHash = {},
      tokenUserHash = {};

    for (let i = 0; i < oThis.userIds.length; i++) {
      const userId = oThis.userIds[i],
        user = oThis.usersByIdHash[userId],
        tokenUser = oThis.tokenUsersByUserIdHash[userId];
      userHash[userId] = new UserModel().safeFormattedData(user);
      tokenUserHash[userId] = new TokenUserModel().safeFormattedData(tokenUser);
    }

    let finalResponse = {
      usersByIdHash: userHash,
      tokenUsersByUserIdHash: tokenUserHash,
      userIds: oThis.userIds,
      meta: responseMetaData
    };

    return finalResponse;
  }

  /**
   * _defaultPageLimit
   *
   * @private
   */
  _defaultPageLimit() {
    return pagination.defaultUserListPageSize;
  }

  /**
   * _minPageLimit
   *
   * @private
   */
  _minPageLimit() {
    return pagination.minUserListPageSize;
  }

  /**
   * _maxPageLimit
   *
   * @private
   */
  _maxPageLimit() {
    return pagination.maxUserListPageSize;
  }

  /**
   * _currentPageLimit
   *
   * @private
   */
  _currentPageLimit() {
    const oThis = this;

    return oThis.limit;
  }
}

module.exports = UserList;
