const rootPrefix = '../../../..',
  CacheMultiBase = require(rootPrefix + '/lib/cacheManagement/multi/Base'),
  ChannelTagModel = require(rootPrefix + '/app/models/mysql/channel/ChannelTag'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cacheManagementConstants = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class for channel tag by channel ids.
 *
 * @class ChannelTagByChannelIds
 */
class ChannelTagByChannelIds extends CacheMultiBase {
  /**
   * Init params in oThis.
   *
   * @param {object} params
   * @param {array<number>} params.channelIds
   *
   * @private
   */
  _initParams(params) {
    const oThis = this;

    oThis.channelIds = params.channelIds;
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
   * Set cache keys.
   *
   * @sets oThis.cacheKeys
   */
  _setCacheKeys() {
    const oThis = this;

    for (let index = 0; index < oThis.channelIds.length; index++) {
      oThis.cacheKeys[oThis._cacheKeyPrefix() + '_cmm_ch_t_ch_' + oThis.channelIds[index]] = oThis.channelIds[index];
    }
  }

  /**
   * Set cache expiry.
   *
   * @sets oThis.cacheExpiry
   */
  _setCacheExpiry() {
    const oThis = this;

    oThis.cacheExpiry = cacheManagementConstants.largeExpiryTimeInterval; // 24 hours ;
  }

  /**
   * Fetch data from source for cache miss ids
   *
   * @param {array<number>} cacheMissIds
   *
   * @returns {Promise<*>}
   */
  async fetchDataFromSource(cacheMissIds) {
    const fetchByIdsRsp = await new ChannelTagModel().fetchActiveChannelsTagsByChannelIds(cacheMissIds);

    return responseHelper.successWithData(fetchByIdsRsp);
  }
}

module.exports = ChannelTagByChannelIds;
