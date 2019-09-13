/**
 * Multi Cache for user device ids by device token.
 *
 * @module lib/cacheManagement/multi/UserDeviceIdsByDeviceToken
 */

const rootPrefix = '../../..',
  UserDeviceModel = require(rootPrefix + '/app/models/mysql/UserDevice'),
  CacheMultiBase = require(rootPrefix + '/lib/cacheManagement/multi/Base'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement'),
  util = require(rootPrefix + '/lib/util'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class UserDeviceIdsByDeviceToken extends CacheMultiBase {
  /**
   * Constructor for UserDeviceIdsByDeviceToken
   *
   * @param params
   * @param {Array} params.deviceTokens: deviceTokens
   *
   * @augments CacheMultiBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);
  }

  /**
   * Init params in oThis.
   *
   * @param params
   * @private
   */
  _initParams(params) {
    const oThis = this;

    oThis.deviceTokens = params.deviceTokens;
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
   */
  _setCacheKeys() {
    const oThis = this;

    for (let ind = 0; ind < oThis.deviceTokens.length; ind++) {
      oThis.cacheKeys[oThis._cacheKeyPrefix() + '_cmm_udibdt_' + util.createMd5Digest(oThis.deviceTokens[ind])] =
        oThis.deviceTokens[ind];
    }
  }

  /**
   * set cache expiry in oThis.cacheExpiry and return it.
   */
  _setCacheExpiry() {
    const oThis = this;
    oThis.cacheExpiry = cacheManagementConst.largeExpiryTimeInterval; // 24 hours ;
  }

  /**
   * Fetch data from source.
   *
   * @return {Result}
   */
  async fetchDataFromSource(cacheMissIds) {
    const oThis = this;

    let fetchByUserIdsRsp = await new UserDeviceModel().fetchUserDeviceIdsByDeviceTokens(cacheMissIds);

    return responseHelper.successWithData(fetchByUserIdsRsp);
  }
}

module.exports = UserDeviceIdsByDeviceToken;
