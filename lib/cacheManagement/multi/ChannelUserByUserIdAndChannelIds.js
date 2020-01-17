/**
 * Multi Cache for channel user by user id and channel ids
 *
 *
 * @module lib/cacheManagement/multi/ChannelUserByUserIdAndChannelIds
 */

const rootPrefix = '../../..',
  ChannelUserModel = require(rootPrefix + '/app/models/mysql/channel/ChannelUser'),
  CacheMultiBase = require(rootPrefix + '/lib/cacheManagement/multi/Base'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class ChannelUserByUserIdAndChannelIds extends CacheMultiBase {
  /**
   * Init params in oThis
   *
   * @param params
   * @private
   */
  _initParams(params) {
    const oThis = this;

    oThis.userId = params.userId;
    oThis.channelIds = params.channelIds;
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
   * set cache keys
   */
  _setCacheKeys() {
    const oThis = this;

    for (let i = 0; i < oThis.channelIds.length; i++) {
      oThis.cacheKeys[oThis._cacheKeyPrefix() + `_cmm_ch_u_uid_${oThis.userId}_chid_` + oThis.channelIds[i]] =
        oThis.channelIds[i];
    }
  }

  /**
   * set cache expiry in oThis.cacheExpiry and return it
   */
  _setCacheExpiry() {
    const oThis = this;
    oThis.cacheExpiry = cacheManagementConst.largeExpiryTimeInterval; // 24 hours ;
  }

  /**
   * Fetch data from source for cache miss ids
   *
   * @param cacheMissIds
   *
   * @return {Promise<*>}
   */
  async fetchDataFromSource(cacheMissIds) {
    const oThis = this;

    let fetchByIdsRsp = await new ChannelUserModel().fetchByUserIdAndChannelIds(cacheMissIds);

    return responseHelper.successWithData(fetchByIdsRsp);
  }
}

module.exports = ChannelUserByUserIdAndChannelIds;
