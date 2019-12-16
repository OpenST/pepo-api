/**
 * Multi Cache for dynamic global constants by kinds.
 *
 *
 * @module lib/cacheManagement/multi/dynamicGlobalConstantsByKind
 */

const rootPrefix = '../../..',
  DynamicGlobalConstantsModel = require(rootPrefix + '/app/models/mysql/DynamicGlobalConstants'),
  CacheMultiBase = require(rootPrefix + '/lib/cacheManagement/multi/Base'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class DynamicGlobalConstantsByKind extends CacheMultiBase {
  /**
   * constructor
   *
   * @param params
   * @param {Array} params.kinds: kinds
   *
   */
  constructor(params) {
    super(params);
  }

  /**
   * Init params in oThis
   *
   * @param params
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

    for (let i = 0; i < oThis.kinds.length; i++) {
      oThis.cacheKeys[oThis._cacheKeyPrefix() + '_cmm_ee_id_' + oThis.kinds[i]] = oThis.kinds[i];
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
   * Fetch data from source for cache miss kinds
   *
   * @param cacheMissIds
   *
   * @return {Promise<*>}
   */
  async fetchDataFromSource(cacheMissKinds) {
    const oThis = this;

    let fetchByKindsRsp = await new DynamicGlobalConstantsModel().getForKinds(cacheMissKinds);

    return responseHelper.successWithData(fetchByKindsRsp);
  }
}

module.exports = DynamicGlobalConstantsByKind;
