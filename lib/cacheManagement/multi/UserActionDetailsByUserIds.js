const rootPrefix = '../../..',
  UserActionDetailModel = require(rootPrefix + '/app/models/cassandra/UserActionDetail'),
  CacheMultiBase = require(rootPrefix + '/lib/cacheManagement/multi/Base'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class UserActionDetailsByUserIds extends CacheMultiBase {
  /**
   * constructor
   *
   * @param params
   * @param {Array} params.userIds: userIds
   * @param {Array} params.userIds: entityIdentifiers
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

    oThis.userId = params.userId;
    oThis.entityIdentifiers = params.entityIdentifiers;
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

    for (let i = 0; i < oThis.entityIdentifiers.length; i++) {
      let currEIdentifier = oThis.entityIdentifiers[i];

      oThis.cacheKeys[oThis._cacheKeyPrefix() + `_cmm_uad_${oThis.userId}_by_uid_` + currEIdentifier] = currEIdentifier;
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
    let fetchByIdsRsp = await new UserActionDetailModel().fetchUserActionDetails(oThis.userId, cacheMissIds);

    return responseHelper.successWithData(fetchByIdsRsp);
  }
}

module.exports = UserActionDetailsByUserIds;
