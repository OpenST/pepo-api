const rootPrefix = '../../../..',
  CacheMultiBase = require(rootPrefix + '/lib/cacheManagement/multi/Base'),
  ChannelUserModel = require(rootPrefix + '/app/models/mysql/channel/ChannelUser'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cacheManagementConstants = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class for channel user by user id.
 *
 * @class ChannelUserByUserIds
 */
class ChannelUserByUserIds extends CacheMultiBase {
  /**
   * Init params in oThis.
   *
   * @param {object} params
   * @param {number} params.userIds
   *
   * @private
   */
  _initParams(params) {
    const oThis = this;

    oThis.userIds = params.userIds;
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

    for (let index = 0; index < oThis.userIds.length; index++) {
      oThis.cacheKeys[oThis._cacheKeyPrefix() + `_cmm_ch_u_uid_` + oThis.userIds[index]] = oThis.userIds[index];
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

    const fetchByUserIdsRsp = await new ChannelUserModel().fetchActiveChannelIdsForUsers(cacheMissIds);

    return responseHelper.successWithData(fetchByUserIdsRsp);
  }
}

module.exports = ChannelUserByUserIds;
