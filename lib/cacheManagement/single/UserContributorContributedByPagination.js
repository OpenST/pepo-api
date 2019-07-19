/**
 * Module for caching user ids contributed by the user.
 *
 * @module lib/cacheManagement/shared/UserContributorContributedByPagination
 */

const rootPrefix = '../../..',
  CacheSingleBase = require(rootPrefix + '/lib/cacheManagement/single/Base'),
  UserContributorModel = require(rootPrefix + '/app/models/mysql/UserContributor'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class to get user ids from cache for contributed to list.
 *
 * @class UserContributorContributedByPagination
 */
class UserContributorContributedByPagination extends CacheSingleBase {
  /**
   * Constructor to get user ids from cache for contributed to list.
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

    oThis.contributedByUserId = params.contributedByUserId;

    oThis.limit = params.limit;
    oThis.page = params.page;
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

    return oThis.page;
  }

  /**
   * Set base cache key
   *
   * @private
   */
  setPaginatedBaseCacheKey() {
    const oThis = this;

    oThis.baseCacheKey = oThis._cacheKeyPrefix() + `_uc_cbuid_${oThis.contributedByUserId}`;
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

    let fetchUsersRsp = await new UserContributorModel().fetchPaginatedUserIdsForContributedByUserId({
      limit: oThis.limit,
      page: oThis.page,
      contributedByUserId: oThis.contributedByUserId
    });

    return responseHelper.successWithData(fetchUsersRsp);
  }
}

module.exports = UserContributorContributedByPagination;
