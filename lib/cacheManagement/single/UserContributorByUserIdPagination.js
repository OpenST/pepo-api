/**
 * Module for caching user ids who contributed to the user.
 *
 * @module lib/cacheManagement/shared/UserContributorByUserIdPagination
 */

const rootPrefix = '../../..',
  CacheSingleBase = require(rootPrefix + '/lib/cacheManagement/single/Base'),
  UserContributorModel = require(rootPrefix + '/app/models/mysql/UserContributor'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class to get user ids from cache for contributed by list.
 *
 * @class UserContributorByUserIdPagination
 */
class UserContributorByUserIdPagination extends CacheSingleBase {
  /**
   * Init params in oThis.
   *
   * @param {object} params
   * @param {number/string} params.userId
   * @param {number} params.limit
   * @param {number} params.page
   *
   * @sets oThis.userId, oThis.limit, oThis.page
   *
   * @private
   */
  _initParams(params) {
    const oThis = this;

    oThis.userId = params.userId;

    oThis.limit = params.limit;
    oThis.page = params.page;
  }

  /**
   * True if its a cache for pagination.
   *
   * @sets oThis.useObject
   *
   * @returns {boolean}
   * @private
   */
  _isPaginatedCache() {
    return true;
  }

  /**
   * Set use object.
   *
   * @sets oThis.useObject
   *
   * @private
   */
  _setUseObject() {
    const oThis = this;

    oThis.useObject = false;
  }

  /**
   * Set cache type.
   *
   * @sets oThis.cacheType
   *
   * @returns {string}
   */
  _setCacheType() {
    const oThis = this;

    oThis.cacheType = cacheManagementConst.memcached;
  }

  /**
   * Get page cache key suffix for paginated cache.
   *
   * @returns {number}
   * @private
   */
  _pageCacheKeySuffix() {
    const oThis = this;

    return oThis.page;
  }

  /**
   * Set base cache key.
   *
   * @sets oThis.baseCacheKey
   *
   * @private
   */
  setPaginatedBaseCacheKey() {
    const oThis = this;

    oThis.baseCacheKey = oThis._cacheKeyPrefix() + `_uc_uid_${oThis.userId}`;
  }

  /**
   * Set cache expiry in oThis.cacheExpiry and return it.
   *
   * @sets oThis.cacheExpiry
   *
   * @return {number}
   */
  setCacheExpiry() {
    const oThis = this;

    oThis.cacheExpiry = cacheManagementConst.largeExpiryTimeInterval;

    return oThis.cacheExpiry;
  }

  /**
   * Fetch data from source.
   *
   * @return {Result}
   */
  async fetchDataFromSource() {
    const oThis = this;

    const fetchUsersRsp = await new UserContributorModel().fetchPaginatedUserIdsForUserId({
      limit: oThis.limit,
      page: oThis.page,
      userId: oThis.userId
    });

    return responseHelper.successWithData(fetchUsersRsp);
  }
}

module.exports = UserContributorByUserIdPagination;
