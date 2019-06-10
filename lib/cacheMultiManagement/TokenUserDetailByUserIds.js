/**
 * Multi Cache for token user details by user ids
 *
 *
 * @module lib/cacheMultiManagement/TokenUserDetailByUserIds
 */

const rootPrefix = '../..',
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
  CacheManagementMultiBase = require(rootPrefix + '/lib/cacheMultiManagement/Base'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class TokenUserDetailsByUserIds extends CacheManagementMultiBase {
  /**
   * constructor
   *
   * @param params
   * @param {Array} params.userIds: userIds
   *
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.userIds = params.userIds;

    oThis.cacheType = cacheManagementConst.memcached;
    oThis.consistentRead = 1;

    // Call sub class method to set cache key using params provided
    oThis._setCacheKeys();

    oThis._setInvertedCacheKeys();

    // Call sub class method to set cache expiry using params provided
    oThis._setCacheExpiry();

    // Call sub class method to set cache implementer using params provided
    oThis._setCacheImplementer();
  }

  /**
   * set cache keys
   */
  _setCacheKeys() {
    const oThis = this;

    for (let i = 0; i < oThis.userIds.length; i++) {
      oThis.cacheKeys[oThis._cacheKeyPrefix() + '_cmm_tud_uid_' + oThis.userIds[i]] = oThis.userIds[i];
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

    let fetchByUserIdsRsp = await new TokenUserModel().fetchByUserIds(oThis.userIds);

    if (fetchByUserIdsRsp && fetchByUserIdsRsp.isSuccess()) {
      return responseHelper.successWithData(fetchByUserIdsRsp.data);
    }

    return responseHelper.successWithData(null);
  }
}

module.exports = TokenUserDetailsByUserIds;
