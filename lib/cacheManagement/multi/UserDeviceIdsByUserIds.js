/**
 * Multi Cache for user device ids by user ids.
 *
 * @module lib/cacheManagement/multi/UserDeviceIdsByUserIds
 */

const rootPrefix = '../../..',
  UserDeviceModel = require(rootPrefix + '/app/models/mysql/UserDevice'),
  CacheMultiBase = require(rootPrefix + '/lib/cacheManagement/multi/Base'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class UserDeviceIdsByUserIds extends CacheMultiBase {
  /**
   * Constructor for UserDeviceIdsByUserIds
   *
   * @param params
   * @param {Array} params.userIds: userIds
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
   * Set cache keys.
   *
   */
  _setCacheKeys() {
    const oThis = this;

    for (let ind = 0; ind < oThis.userIds.length; ind++) {
      oThis.cacheKeys[oThis._cacheKeyPrefix() + '_cmm_uds_id_' + oThis.userIds[ind]] = oThis.userIds[ind];
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
   * Fetch data from source for cache miss ids
   *
   * @param cacheMissIds
   *
   * @return {Promise<*>}
   */
  async fetchDataFromSource(cacheMissIds) {
    const oThis = this;

    let fetchByUserIdsRsp = await new UserDeviceModel().fetchByUserIds(cacheMissIds);

    return responseHelper.successWithData(fetchByUserIdsRsp);
  }
}

module.exports = UserDeviceIdsByUserIds;
