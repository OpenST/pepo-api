const rootPrefix = '../../..',
  UserTagModel = require(rootPrefix + '/app/models/mysql/UserTag'),
  CacheMultiBase = require(rootPrefix + '/lib/cacheManagement/multi/Base'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class UserTagsByUserIds extends CacheMultiBase {
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

    oThis.userIds = params.userIds;
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

    for (let i = 0; i < oThis.userIds.length; i++) {
      oThis.cacheKeys[oThis._cacheKeyPrefix() + '_cmm_utags_uid_' + oThis.userIds[i]] = oThis.userIds[i];
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
   * Fetch data from source for cache miss ids
   *
   * @param cacheMissIds
   *
   * @return {Promise<*>}
   */
  async fetchDataFromSource(cacheMissIds) {
    const oThis = this;

    let fetchByUserIdsRsp = await new UserTagModel().fetchByUserIds(cacheMissIds);

    return responseHelper.successWithData(fetchByUserIdsRsp);
  }
}

module.exports = UserTagsByUserIds;
