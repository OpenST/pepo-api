const rootPrefix = '../../../..',
  CacheMultiBase = require(rootPrefix + '/lib/cacheManagement/multi/Base'),
  ChannelUserModel = require(rootPrefix + '/app/models/mysql/channel/ChannelUser'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cacheManagementConstants = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class for channel user by user id and channel ids.
 *
 * @class ChannelUserByUserIdAndChannelIds
 */
class ChannelUserByUserIdAndChannelIds extends CacheMultiBase {
  /**
   * Init params in oThis.
   *
   * @param {object} params
   * @param {number} params.userId
   * @param {array<number>} params.channelIds
   *
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
      oThis.cacheKeys[oThis._cacheKeyPrefix() + `_cmm_ch_u_uid_${oThis.userId}_chid_` + oThis.channelIds[index]] =
        oThis.channelIds[index];
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
    const oThis = this;

    const fetchByIdsRsp = await new ChannelUserModel().fetchByUserIdAndChannelIds(oThis.userId, cacheMissIds);

    return responseHelper.successWithData(fetchByIdsRsp);
  }
}

module.exports = ChannelUserByUserIdAndChannelIds;
