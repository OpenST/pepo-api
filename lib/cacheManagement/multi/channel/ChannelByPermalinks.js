const rootPrefix = '../../../..',
  ChannelModel = require(rootPrefix + '/app/models/mysql/channel/Channel'),
  CacheMultiBase = require(rootPrefix + '/lib/cacheManagement/multi/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cacheManagementConstants = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class for channel by permalink cache.
 *
 * @class ChannelByPermalinks
 */
class ChannelByPermalinks extends CacheMultiBase {
  /**
   * Init params in oThis.
   *
   * @param {object} params
   * @param {array<number>} params.ids
   *
   * @private
   */
  _initParams(params) {
    const oThis = this;

    oThis.channelPermalinks = params.permalinks;
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

    for (let index = 0; index < oThis.channelPermalinks.length; index++) {
      oThis.cacheKeys[oThis._cacheKeyPrefix() + '_cmm_ch_pl_' + oThis.channelPermalinks[index]] =
        oThis.channelPermalinks[index];
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
   * Fetch data from source for cacheMissPermalinks.
   *
   * @param {array<string>} cacheMissPermalinks
   *
   * @returns {Promise<*>}
   */
  async fetchDataFromSource(cacheMissPermalinks) {
    const fetchRsp = await new ChannelModel().fetchIdsByPermalinks(cacheMissPermalinks);

    return responseHelper.successWithData(fetchRsp);
  }
}

module.exports = ChannelByPermalinks;
