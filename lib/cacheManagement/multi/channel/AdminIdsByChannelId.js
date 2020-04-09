const rootPrefix = '../../../..',
  ChannelUserModel = require(rootPrefix + '/app/models/mysql/channel/ChannelUser'),
  CacheMultiBase = require(rootPrefix + '/lib/cacheManagement/multi/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cacheManagementConstants = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class to get channel admin ids by channel ids cache.
 *
 * @class AdminIdsByChannelId
 */
class AdminIdsByChannelId extends CacheMultiBase {
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
      oThis.cacheKeys[oThis._cacheKeyPrefix() + '_cmm_adm_ch_id_' + oThis.channelIds[index]] = oThis.channelIds[index];
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
   * Fetch data from source for cache miss ids.
   *
   * @param {array<number>} cacheMissIds
   *
   * @returns {Promise<*>}
   */
  async fetchDataFromSource(cacheMissIds) {
    const fetchByChannelIdsRsp = await new ChannelUserModel().fetchAdminProfilesByChannelId(cacheMissIds);

    return responseHelper.successWithData(fetchByChannelIdsRsp);
  }
}

module.exports = AdminIdsByChannelId;
