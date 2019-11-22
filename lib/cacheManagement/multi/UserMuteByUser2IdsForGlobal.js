const rootPrefix = '../../..',
  UserMuteModel = require(rootPrefix + '/app/models/mysql/UserMute'),
  CacheMultiBase = require(rootPrefix + '/lib/cacheManagement/multi/Base'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class UserMuteByUser2IdsForGlobal extends CacheMultiBase {
  /**
   * constructor
   *
   * @param params
   * @param {Array} params.user2Ids: user2Ids
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

    oThis.user2Ids = params.user2Ids;
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

    for (let i = 0; i < oThis.user2Ids.length; i++) {
      oThis.cacheKeys[oThis._cacheKeyPrefix() + '_cmm_all_um_u2id_' + oThis.user2Ids[i]] = oThis.user2Ids[i];
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
  async fetchDataFromSource(cacheMissIds) {
    const oThis = this;

    let fetchByUser2IdsRsp = await new UserMuteModel().fetchForAllByUser2Ids(cacheMissIds);

    return responseHelper.successWithData(fetchByUser2IdsRsp);
  }
}

module.exports = UserMuteByUser2IdsForGlobal;
