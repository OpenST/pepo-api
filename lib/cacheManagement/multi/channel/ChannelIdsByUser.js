const rootPrefix = '../../../..',
  ChannelUserModel = require(rootPrefix + '/app/models/mysql/channel/ChannelUser'),
  CacheMultiBase = require(rootPrefix + '/lib/cacheManagement/multi/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cacheManagementConstants = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class for channel by ids cache.
 *
 * @class ChannelIdsByUser
 */
class ChannelIdsByUser extends CacheMultiBase {
  /**
   * Init params in oThis.
   *
   * @param {object} params
   * @param {array<number>} params.userIds
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
      oThis.cacheKeys[oThis._cacheKeyPrefix() + '_cmm_cu_user_id_' + oThis.userIds[index]] = oThis.userIds[index];
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
    const fetchByIdsRsp = await new ChannelUserModel().fetchByUserIds(cacheMissIds);

    return responseHelper.successWithData(fetchByIdsRsp);
  }
}

module.exports = ChannelIdsByUser;
