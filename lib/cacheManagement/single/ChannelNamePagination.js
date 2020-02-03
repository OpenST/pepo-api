const rootPrefix = '../../..',
  ChannelModel = require(rootPrefix + '/app/models/mysql/channel/Channel'),
  CacheSingleBase = require(rootPrefix + '/lib/cacheManagement/single/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cacheManagementConstants = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class for channel name paginated cache.
 *
 * @class ChannelNamePagination
 */
class ChannelNamePagination extends CacheSingleBase {
  /**
   * Init params in oThis.
   *
   * @param {object} params
   * @param {number} [params.limit]
   * @param {number} [params.paginationTimestamp]
   * @param {string} params.channelPrefix
   *
   * @sets oThis.limit, oThis.paginationTimestamp, oThis.channelPrefix
   *
   * @private
   */
  _initParams(params) {
    const oThis = this;

    oThis.limit = params.limit;
    oThis.paginationTimestamp = params.paginationTimestamp;
    oThis.channelPrefix = params.channelPrefix;
  }

  /**
   * True if its a cache for pagination.
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
   */
  _setCacheType() {
    const oThis = this;

    oThis.cacheType = cacheManagementConstants.memcached;
  }

  /**
   * Get paginationTimestamp cache key suffix for paginated cache.
   *
   * @returns {number}
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

    oThis.cacheExpiry = cacheManagementConstants.verySmallExpiryTimeInterval;

    return oThis.cacheExpiry;
  }

  /**
   * Fetch data from source.
   *
   * @return {Result}
   */
  async fetchDataFromSource() {
    const oThis = this;

    // This value is only returned if cache is not set.
    const fetchChannelsRsp = await new ChannelModel().getChannelsByPrefix({
      limit: oThis.limit,
      paginationTimestamp: oThis.paginationTimestamp,
      channelPrefix: oThis.channelPrefix,
      isAdminSearch: false
    });

    return responseHelper.successWithData(fetchChannelsRsp);
  }
}

module.exports = ChannelNamePagination;
