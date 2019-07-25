/**
 * Module for caching Twitter user ids who are followed by user on twitter and are registered
 * but not supported on pepo.
 *
 * @module lib/cacheManagement/shared/TwitterUserConnectionByUser1Pagination
 */

const rootPrefix = '../../..',
  CacheSingleBase = require(rootPrefix + '/lib/cacheManagement/single/Base'),
  TwitterUserConnectionModel = require(rootPrefix + '/app/models/mysql/TwitterUserConnection'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class to get twitter user ids from cache for twitter user1 id.
 *
 * @class TwitterUserConnectionByUser1Pagination
 */
class TwitterUserConnectionByUser1Pagination extends CacheSingleBase {
  /**
   * Init Params in oThis.
   *
   * @param {object} params
   * @param {string} params.twitterUser1Id
   * @param {number} params.limit
   * @param {number} params.page
   *
   * @private
   */
  _initParams(params) {
    const oThis = this;

    oThis.twitterUser1Id = params.twitterUser1Id;

    oThis.limit = params.limit;
    oThis.page = params.page;
  }

  /**
   * True if its a cache for pagination.
   *
   * @sets oThis.useObject
   *
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
   * @private
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
   * Set base cache key.
   *
   * @sets oThis.baseCacheKey
   *
   * @private
   */
  setPaginatedBaseCacheKey() {
    const oThis = this;

    oThis.baseCacheKey = oThis._cacheKeyPrefix() + `_tuc_tuid1_${oThis.twitterUser1Id}`;
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

    const fetchUsersRsp = await new TwitterUserConnectionModel().fetchPaginatedTwitterUser2IdsForTwitterUser1Id({
      limit: oThis.limit,
      page: oThis.page,
      twitterUser1Id: oThis.twitterUser1Id
    });

    return responseHelper.successWithData(fetchUsersRsp);
  }
}

module.exports = TwitterUserConnectionByUser1Pagination;
