const rootPrefix = '../../..',
  ChannelUserModel = require(rootPrefix + '/app/models/mysql/channel/ChannelUser'),
  CacheSingleBase = require(rootPrefix + '/lib/cacheManagement/single/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class to get channel user details by channel id.
 *
 * @class ChannelUsersByChannelIdPagination
 */
class ChannelUsersByChannelIdPagination extends CacheSingleBase {
  /**
   * Init params in oThis.
   *
   * @param {object} params
   * @param {number} params.channelId
   * @param {number} params.limit
   * @param {string} params.page
   *
   * @sets oThis.channelId, oThis.limit, oThis.page
   *
   * @private
   */
  _initParams(params) {
    const oThis = this;

    oThis.channelId = params.channelId;

    oThis.limit = params.limit;
    oThis.page = params.page;
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

    oThis.baseCacheKey = oThis._cacheKeyPrefix() + `_cu_cid_${oThis.channelId}`;
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

    const fetchUsersRsp = await new ChannelUserModel().fetchByChannelId({
      channelId: oThis.channelId,
      limit: oThis.limit,
      page: oThis.page
    });

    return responseHelper.successWithData(fetchUsersRsp);
  }
}

module.exports = ChannelUsersByChannelIdPagination;
