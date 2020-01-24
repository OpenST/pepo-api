const rootPrefix = '../../..',
  CacheMultiBase = require(rootPrefix + '/lib/cacheManagement/multi/Base'),
  DynamicVariableModel = require(rootPrefix + '/app/models/mysql/big/DynamicVariable'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cacheManagementConstants = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class for dynamic variables by kind cache.
 *
 * @class DynamicVariablesByKind
 */
class DynamicVariablesByKind extends CacheMultiBase {
  /**
   * Init params in oThis.
   *
   * @param {object} params
   * @param {array<string>} [params.kinds]
   *
   * @private
   */
  _initParams(params) {
    const oThis = this;

    oThis.kinds = params.kinds;
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

    for (let index = 0; index < oThis.kinds.length; index++) {
      oThis.cacheKeys[oThis._cacheKeyPrefix() + '_cmm_dgc_k_' + oThis.kinds[index]] = oThis.kinds[index];
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
   * Fetch data from source for cache miss kinds.
   *
   * @param {array<string>} cacheMissKinds
   *
   * @return {Promise<*>}
   */
  async fetchDataFromSource(cacheMissKinds) {
    const fetchByKindsRsp = await new DynamicVariableModel().getForKinds(cacheMissKinds);

    return responseHelper.successWithData(fetchByKindsRsp);
  }
}

module.exports = DynamicVariablesByKind;
