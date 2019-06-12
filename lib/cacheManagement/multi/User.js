const rootPrefix = '../../..',
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  CacheMultiBase = require(rootPrefix + '/lib/cacheManagement/multi/Base'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class UserByIds extends CacheMultiBase {
  /**
   * constructor
   *
   * @param params
   * @param {Array} params.userIds: userIds
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
   * set cache keys
   */
  _setCacheKeys() {
    const oThis = this;

    for (let i = 0; i < oThis.ids.length; i++) {
      oThis.cacheKeys[oThis._cacheKeyPrefix() + '_cmm_u_id_' + oThis.ids[i]] = oThis.ids[i];
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

    let fetchByIdsRsp = await new UserModel().fetchByIds(oThis.ids);

    if (Object.keys(fetchByIdsRsp).length > 0) {
      return responseHelper.successWithData(fetchByIdsRsp);
    }

    return responseHelper.successWithData(null);
  }
}

module.exports = UserByIds;
