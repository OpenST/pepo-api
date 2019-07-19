/**
 * Module for caching user activity rows for logged in user.
 *
 * @module lib/cacheManagement/shared/UserActivityByUserIdForSelfPagination
 */

const rootPrefix = '../../..',
  CacheSingleBase = require(rootPrefix + '/lib/cacheManagement/single/Base'),
  UserActivityModel = require(rootPrefix + '/app/models/mysql/UserActivity'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class to get user activity rows from cache for logged in user.
 *
 * @class UserActivityByUserIdForSelfPagination
 */
class UserActivityByUserIdForSelfPagination extends CacheSingleBase {
  /**
   * Constructor
   *
   * @param {object} params
   *
   * @augments CacheSingleBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);
  }

  /**
   * Init Params in oThis
   *
   * @param params
   * @private
   */
  _initParams(params) {
    const oThis = this;

    oThis.userId = params.userId;

    oThis.limit = params.limit;
    oThis.paginationTimestamp = params.paginationTimestamp;
  }

  /**
   * True if its a cache for pagination
   *
   * @sets oThis.useObject
   *
   * @private
   */
  _isPaginatedCache() {
    return true;
  }

  /**
   * Set use object
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
   * Get page cache key suffix for paginated cache
   *
   * @private
   */
  _pageCacheKeySuffix() {
    const oThis = this;

    return oThis.paginationTimestamp;
  }

  /**
   * Set base cache key
   *
   * @private
   */
  setPaginatedBaseCacheKey() {
    const oThis = this;

    oThis.baseCacheKey = oThis._cacheKeyPrefix() + `_uAc_c_uid_${oThis.userId}`;
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
   * Fetch data from source
   *
   * @return {Result}
   */
  async fetchDataFromSource() {
    const oThis = this;

    let fetchUsersRsp = await new UserActivityModel()._currentUserActivityIds({
      limit: oThis.limit,
      paginationTimestamp: oThis.paginationTimestamp,
      userId: oThis.userId
    });

    return responseHelper.successWithData(fetchUsersRsp);
  }
}

module.exports = UserActivityByUserIdForSelfPagination;
