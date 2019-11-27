/**
 * Multi Cache for user socket connection details by usersIds
 *
 *
 * @module lib/cacheManagement/multi/UserSocketConDetailsByUserId
 */

const rootPrefix = '../../..',
  UserSocketConnectionDetailsModel = require(rootPrefix + '/app/models/mysql/UserSocketConnectionDetails'),
  CacheMultiBase = require(rootPrefix + '/lib/cacheManagement/multi/Base'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class UserSocketConDetailsByUserIds extends CacheMultiBase {
  /**
   * constructor
   *
   * @param params
   * @param {Array} params.ids: userIds
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
      oThis.cacheKeys[oThis._cacheKeyPrefix() + '_cmm_uscd_id_' + oThis.userIds[i]] = oThis.userIds[i];
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
    const fetchByIdsRsp = await new UserSocketConnectionDetailsModel().fetchByUserIds(cacheMissIds);

    return responseHelper.successWithData(fetchByIdsRsp);
  }
}

module.exports = UserSocketConDetailsByUserIds;
