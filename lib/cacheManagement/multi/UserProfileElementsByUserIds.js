/**
 * Multi Cache for user profile elements by usersIds
 *
 *
 * @module lib/cacheManagement/multi/UserProfileElementsByUserIds
 */

const rootPrefix = '../../..',
  UserProfileElementModel = require(rootPrefix + '/app/models/mysql/UserProfileElement'),
  CacheMultiBase = require(rootPrefix + '/lib/cacheManagement/multi/Base'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class UserProfileElementsByUserIds extends CacheMultiBase {
  /**
   * constructor
   *
   * @param params
   * @param {Array} params.ids: ids
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

    oThis.usersIds = params.usersIds;
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

    for (let i = 0; i < oThis.usersIds.length; i++) {
      oThis.cacheKeys[oThis._cacheKeyPrefix() + '_cmm_url_id_' + oThis.usersIds[i]] = oThis.usersIds[i];
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

    let fetchByIdsRsp = await new UserProfileElementModel().fetchByUserIds(cacheMissIds);

    return responseHelper.successWithData(fetchByIdsRsp);
  }
}

module.exports = UserProfileElementsByUserIds;
