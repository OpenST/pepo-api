/**
 * Multi Cache for user feed by ids
 *
 *
 * @module lib/cacheManagement/multi/UserFeedByIds
 */

const rootPrefix = '../../..',
  UserFeedModel = require(rootPrefix + '/app/models/mysql/UserFeed'),
  CacheMultiBase = require(rootPrefix + '/lib/cacheManagement/multi/Base'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class UserFeedByIds extends CacheMultiBase {
  /**
   * constructor
   *
   * @param params
   * @param {Array} params.Ids: Ids
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

    oThis.Ids = params.Ids;
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

    for (let i = 0; i < oThis.Ids.length; i++) {
      oThis.cacheKeys[oThis._cacheKeyPrefix() + '_cmm_uf_id_' + oThis.Ids[i]] = oThis.Ids[i];
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
   * fetch data from source
   *
   * @return {Result}
   */
  async fetchDataFromSource() {
    const oThis = this;

    let fetchByIdsRsp = await new UserFeedModel().fetchByIds(oThis.Ids);

    if (fetchByIdsRsp && fetchByIdsRsp.isSuccess()) {
      return responseHelper.successWithData(fetchByIdsRsp.data);
    }

    return responseHelper.successWithData(null);
  }
}

module.exports = UserFeedByIds;
