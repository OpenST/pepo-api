const rootPrefix = '../../..',
  CacheMultiBase = require(rootPrefix + '/lib/cacheManagement/multi/Base'),
  PreLaunchInviteModel = require(rootPrefix + '/app/models/mysql/PreLaunchInvite'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class for pre launch invite by twitter ids cache.
 *
 * @class PreLaunchInviteByTwitterIds
 */
class PreLaunchInviteByTwitterIds extends CacheMultiBase {
  /**
   * Init params in oThis.
   *
   * @param {object} params
   * @param {array} params.twitterIds
   *
   * @private
   */
  _initParams(params) {
    const oThis = this;

    oThis.twitterIds = params.twitterIds;
  }

  /**
   * Set cache type.
   *
   * @sets oThis.cacheType
   *
   * @private
   */
  _setCacheType() {
    const oThis = this;

    oThis.cacheType = cacheManagementConst.memcached;
  }

  /**
   * Set cache keys.
   *
   * @sets oThis.cacheKeys
   *
   * @private
   */
  _setCacheKeys() {
    const oThis = this;

    for (let index = 0; index < oThis.twitterIds.length; index++) {
      oThis.cacheKeys[oThis._cacheKeyPrefix() + '_cmm_pli_tid_' + oThis.twitterIds[index]] = oThis.twitterIds[index];
    }
  }

  /**
   * Set cache expiry in oThis.cacheExpiry.
   *
   * @sets oThis.cacheExpiry
   *
   * @private
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
    const fetchByTwitterIdsRsp = await new PreLaunchInviteModel().fetchByTwitterIds(cacheMissIds);

    return responseHelper.successWithData(fetchByTwitterIdsRsp);
  }
}

module.exports = PreLaunchInviteByTwitterIds;
