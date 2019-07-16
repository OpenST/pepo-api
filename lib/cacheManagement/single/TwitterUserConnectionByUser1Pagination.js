/**
 * Module for caching Twitter user ids who are followed by user on twitter and are registered
 * but not supported on pepo.
 *
 * @module lib/cacheManagement/shared/TwitterUserConnectionByUser1Pagination
 */

const uuidV4 = require('uuid/v4');

const rootPrefix = '../../..',
  CacheSingleBase = require(rootPrefix + '/lib/cacheManagement/single/Base'),
  MemcachedProvider = require(rootPrefix + '/lib/providers/memcached'),
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
   * Constructor to get user ids from cache for contributed by list.
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

    oThis.twitterUser1Id = params.twitterUser1Id;

    oThis.limit = params.limit;
    oThis.page = params.page;

    oThis.baseCacheKey = null;
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
   * Set cache implementer in oThis.cacheImplementer.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _setCacheImplementer() {
    const oThis = this;

    if (oThis.cacheImplementer) {
      return;
    }

    let cacheObject = await MemcachedProvider.getInstance(oThis.consistentBehavior);

    // Set cacheImplementer to perform caching operations.
    oThis.cacheImplementer = cacheObject.cacheInstance;
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
   * Fetch.
   *
   * @return {Promise<*>}
   */
  async fetch() {
    const oThis = this;

    await oThis._setPageCacheKey();

    return super.fetch();
  }

  /**
   * Set cache key.
   *
   * @return {String}
   */
  async _setPageCacheKey() {
    const oThis = this;

    await oThis._setCacheImplementer();

    // Cache hit for version.
    const versionCacheResponse = await oThis.cacheImplementer.getObject(oThis._versionCacheKey);

    let versionDetail = null;

    if (versionCacheResponse.isSuccess() && versionCacheResponse.data.response != null) {
      versionDetail = versionCacheResponse.data.response;
    }

    if (!versionDetail || versionCacheResponse.isFailure() || versionDetail.limit !== oThis.limit) {
      // Set version cache.
      versionDetail = {
        v: uuidV4(),
        limit: oThis.limit
      };

      // NOTE: Set this key only on page one. If it's set on every page request. There is a possibility of some data
      // not being included in any page.
      if (Number(oThis.page) === 1) {
        await oThis.cacheImplementer.setObject(oThis._versionCacheKey, versionDetail, oThis.cacheExpiry);
      }
    }

    oThis.cacheKey = oThis.baseCacheKey + '_' + versionDetail.v + '_' + oThis.page;
  }

  /**
   * Set base cache key
   *
   * @private
   */
  setCacheKey() {
    const oThis = this;

    oThis.baseCacheKey = oThis._cacheKeyPrefix() + `_tuc_tuid1_${oThis.twitterUser1Id}`;
  }

  /**
   * Set base cache key
   *
   * @private
   */
  get _versionCacheKey() {
    const oThis = this;

    return oThis.baseCacheKey + '_v';
  }

  /**
   * Delete the cache entry
   *
   * @returns {Promise<*>}
   */
  async clear() {
    const oThis = this;

    await oThis._setCacheImplementer();

    return oThis.cacheImplementer.del(oThis._versionCacheKey);
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

    let fetchUsersRsp = await new TwitterUserConnectionModel().fetchPaginatedTwitterUser2IdsForTwitterUser1Id({
      limit: oThis.limit,
      page: oThis.page,
      twitterUser1Id: oThis.twitterUser1Id
    });

    return responseHelper.successWithData(fetchUsersRsp);
  }
}

module.exports = TwitterUserConnectionByUser1Pagination;
