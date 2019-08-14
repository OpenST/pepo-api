const rootPrefix = '../../..',
  UserNotificationModel = require(rootPrefix + '/app/models/cassandra/UserNotification'),
  CacheSingleBase = require(rootPrefix + '/lib/cacheManagement/single/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class to get video details by user id.
 *
 * @class UserNotificationsByUserIdPagination
 */
class UserNotificationsByUserIdPagination extends CacheSingleBase {
  /**
   * Init params in oThis.
   *
   * @param {object} params
   * @param {number} params.userId
   * @param {number} params.limit
   * @param {string} params.pageState
   * @param {Integer} params.pageNumber
   *
   * @sets oThis.userId, oThis.limit, oThis.pageState, oThis.pageNumber
   *
   * @private
   */
  _initParams(params) {
    const oThis = this;

    oThis.userId = params.userId;

    oThis.limit = params.limit;
    oThis.pageState = params.pageState;
    oThis.pageNumber = params.pageNumber;
  }

  /**
   * Return true if its a cache for pagination.
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
   * Get page cache key suffix for paginated cache
   *
   * @returns {string}
   * @private
   */
  _pageCacheKeySuffix() {
    const oThis = this;

    return oThis.pageNumber;
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

    oThis.baseCacheKey = oThis._cacheKeyPrefix() + `_c_un_uid_${oThis.userId}`;
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

    const fetchUsersRsp = await new UserNotificationModel().fetchPaginatedForUserId({
      userId: oThis.userId,
      limit: oThis.limit,
      pageState: oThis.pageState
    });

    return responseHelper.successWithData(fetchUsersRsp);
  }
}

module.exports = UserNotificationsByUserIdPagination;
