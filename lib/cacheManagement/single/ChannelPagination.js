const rootPrefix = '../../..',
  ChannelModel = require(rootPrefix + '/app/models/mysql/channel/Channel'),
  CacheSingleBase = require(rootPrefix + '/lib/cacheManagement/single/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement');

class ChannelPagination extends CacheSingleBase {
  /**
   * Constructor to get channels form cache.
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
    oThis.channelPrefix = params.channelPrefix;
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

    oThis.baseCacheKey = oThis._cacheKeyPrefix() + '_clp_' + encodeURIComponent(oThis.channelPrefix);
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
    let fetchChannelsRsp = await new ChannelModel().getChannelsByPrefix({
      limit: oThis.limit,
      page: oThis.page,
      channelPrefix: oThis.channelPrefix
    });

    return responseHelper.successWithData(fetchChannelsRsp);
  }
}

module.exports = ChannelPagination;
