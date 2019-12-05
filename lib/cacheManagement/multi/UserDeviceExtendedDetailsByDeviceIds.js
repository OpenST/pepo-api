const rootPrefix = '../../..',
  CacheMultiBase = require(rootPrefix + '/lib/cacheManagement/multi/Base'),
  UserDeviceExtendedDetailModel = require(rootPrefix + '/app/models/mysql/UserDeviceExtendedDetail'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cacheManagementConstants = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class for user device extended details by ids cache.
 *
 * @class UserDeviceExtendedDetailsByDeviceIdsCache
 */
class UserDeviceExtendedDetailsByDeviceIdsCache extends CacheMultiBase {
  /**
   * Init params in oThis.
   *
   * @param {object} params
   * @param {array<number>} params.deviceIds
   *
   * @sets oThis.deviceIds
   *
   * @private
   */
  _initParams(params) {
    const oThis = this;

    oThis.deviceIds = params.deviceIds;
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

    oThis.cacheType = cacheManagementConstants.memcached;
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

    for (let ind = 0; ind < oThis.deviceIds.length; ind++) {
      oThis.cacheKeys[oThis._cacheKeyPrefix() + '_cmm_ude_did_' + oThis.deviceIds[ind]] = oThis.deviceIds[ind];
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

    oThis.cacheExpiry = cacheManagementConstants.largeExpiryTimeInterval; // 24 hours ;
  }

  /**
   * Fetch data from source for cache miss ids.
   *
   * @param cacheMissIds
   *
   * @return {Promise<*>}
   */
  async fetchDataFromSource(cacheMissIds) {
    const fetchByIdsRsp = await new UserDeviceExtendedDetailModel().getByDeviceIds(cacheMissIds);

    return responseHelper.successWithData(fetchByIdsRsp);
  }
}

module.exports = UserDeviceExtendedDetailsByDeviceIdsCache;
