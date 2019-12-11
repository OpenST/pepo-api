const rootPrefix = '../../..',
  UserMuteModel = require(rootPrefix + '/app/models/mysql/UserMute'),
  CacheMultiBase = require(rootPrefix + '/lib/cacheManagement/multi/Base'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class UserMuteByUser1Ids extends CacheMultiBase {
  /**
   * constructor
   *
   * @param params
   * @param {Array} params.user1Ids: user1Ids
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

    oThis.user1Ids = params.user1Ids;
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
   * Set cache keys.
   *
   * @private
   */
  _setCacheKeys() {
    const oThis = this;
    for (let i = 0; i < oThis.user1Ids.length; i++) {
      let currUser1Id = oThis.user1Ids[i].toString();

      oThis.cacheKeys[oThis._cacheKeyPrefix() + '_cmm_um_u1id_' + currUser1Id] = currUser1Id;
    }
  }

  /**
   * Set cache expiry in oThis.cacheExpiry and return it.
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
   * @param {array} cacheMissIds
   *
   * @return {Promise<*>}
   */
  async fetchDataFromSource(cacheMissIds) {
    let fetchByUser2IdsRsp = await new UserMuteModel().fetchMutedUsersByUser1Ids(cacheMissIds);

    return responseHelper.successWithData(fetchByUser2IdsRsp);
  }
}

module.exports = UserMuteByUser1Ids;
