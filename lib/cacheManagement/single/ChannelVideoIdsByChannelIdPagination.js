const rootPrefix = '../../..',
  ChannelVideoModel = require(rootPrefix + '/app/models/mysql/channel/ChannelVideo'),
  CacheSingleBase = require(rootPrefix + '/lib/cacheManagement/single/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cacheManagementConstants = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class to get channel video ids by channel id.
 *
 * @class ChannelVideoIdsByChannelIdPagination
 */
class ChannelVideoIdsByChannelIdPagination extends CacheSingleBase {
  /**
   * Init params in oThis.
   *
   * @param {object} params
   * @param {number} params.channelId
   * @param {number} params.limit
   * @param {string} params.paginationTimestamp
   *
   * @sets oThis.userId, oThis.limit, oThis.paginationTimestamp
   *
   * @private
   */
  _initParams(params) {
    const oThis = this;

    oThis.channelId = params.channelId;
    oThis.limit = params.limit;
    oThis.paginationTimestamp = params.paginationTimestamp;
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

    oThis.cacheType = cacheManagementConstants.memcached;
  }

  /**
   * Get page cache key suffix for paginated cache.
   *
   * @returns {string}
   * @private
   */
  _pageCacheKeySuffix() {
    const oThis = this;

    return oThis.paginationTimestamp;
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

    oThis.baseCacheKey = oThis._cacheKeyPrefix() + `_vid_cid_${oThis.channelId}`;
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

    oThis.cacheExpiry = cacheManagementConstants.largeExpiryTimeInterval;

    return oThis.cacheExpiry;
  }

  /**
   * Fetch data from source.
   *
   * @return {Result}
   */
  async fetchDataFromSource() {
    const oThis = this;

    const fetchUsersRsp = await new ChannelVideoModel().fetchVideoIdsByChannelId({
      channelId: oThis.channelId,
      limit: oThis.limit,
      paginationTimestamp: oThis.paginationTimestamp
    });

    return responseHelper.successWithData(fetchUsersRsp);
  }
}

module.exports = ChannelVideoIdsByChannelIdPagination;
