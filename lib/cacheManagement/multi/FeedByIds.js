/**
 * Multi Cache for feed by ids
 *
 *
 * @module lib/cacheManagement/multi/FeedByIds
 */

const rootPrefix = '../../..',
  FeedModel = require(rootPrefix + '/app/models/mysql/Feed'),
  CacheMultiBase = require(rootPrefix + '/lib/cacheManagement/multi/Base'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class FeedByIds extends CacheMultiBase {
  /**
   * Constructor
   *
   * @param params
   * @param {Array} params.ids: ids
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

    oThis.ids = params.ids;
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
   * Set cache keys
   */
  _setCacheKeys() {
    const oThis = this;

    for (let i = 0; i < oThis.ids.length; i++) {
      oThis.cacheKeys[oThis._cacheKeyPrefix() + '_cmm_f_id_' + oThis.ids[i]] = oThis.ids[i];
    }
  }

  /**
   * Set cache expiry in oThis.cacheExpiry and return it
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
    const fetchByIdsRsp = await new FeedModel().fetchByIds(cacheMissIds);

    return responseHelper.successWithData(fetchByIdsRsp);
  }
}

module.exports = FeedByIds;
