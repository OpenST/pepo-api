const rootPrefix = '../../..',
  TagModel = require(rootPrefix + '/app/models/mysql/Tag'),
  CacheSingleBase = require(rootPrefix + '/lib/cacheManagement/single/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement');

class TagPagination extends CacheSingleBase {
  /**
   * Constructor to get token user form cache.
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

    oThis.limit = params.limit;
    oThis.page = params.page;
    oThis.tagPrefix = params.tagPrefix;
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

    oThis.baseCacheKey = oThis._cacheKeyPrefix() + '_tlp_' + encodeURIComponent(oThis.tagPrefix);
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

    oThis.cacheExpiry = cacheManagementConst.verySmallExpiryTimeInterval;

    return oThis.cacheExpiry;
  }

  /**
   * Fetch data from source
   *
   * @return {Result}
   */
  async fetchDataFromSource() {
    const oThis = this;

    // This value is only returned if cache is not set.
    let fetchUsersRsp = await new TagModel().getTagsByPrefix({
      limit: oThis.limit,
      page: oThis.page,
      tagPrefix: oThis.tagPrefix
    });

    return responseHelper.successWithData(fetchUsersRsp);
  }
}

module.exports = TagPagination;
