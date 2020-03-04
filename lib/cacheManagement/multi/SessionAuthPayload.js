const rootPrefix = '../../..',
  CacheMultiBase = require(rootPrefix + '/lib/cacheManagement/multi/Base'),
  SessionAuthPayloadModel = require(rootPrefix + '/app/models/mysql/big/SessionAuthPayload'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cacheManagementConstants = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class for session auth payload cache.
 *
 * @class SessionAuthPayload
 */
class SessionAuthPayload extends CacheMultiBase {
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

    oThis.ids = params.ids;
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

    for (let ind = 0; ind < oThis.ids.length; ind++) {
      oThis.cacheKeys[oThis._cacheKeyPrefix() + '_cmm_sap_id_' + oThis.ids[ind]] = oThis.ids[ind];
    }
  }

  /**
   * Set cache expiry.
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
   * @param {array<number>} cacheMissIds
   *
   * @return {Promise<*>}
   */
  async fetchDataFromSource(cacheMissIds) {
    const fetchByIdsRsp = await new SessionAuthPayloadModel().fetchByIds(cacheMissIds);

    return responseHelper.successWithData(fetchByIdsRsp);
  }
}

module.exports = SessionAuthPayload;
