const rootPrefix = '../../..',
  UserStatModel = require(rootPrefix + '/app/models/mysql/UserStat'),
  CacheMultiBase = require(rootPrefix + '/lib/cacheManagement/multi/Base'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for user stats by user ids cache.
 *
 * @class UserStatByUserIds
 */
class UserStatByUserIds extends CacheMultiBase {
  /**
   * Init params in oThis.
   *
   * @param {object} params
   * @param {array} params.userIds
   *
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
   * @private
   */
  _setCacheType() {
    const oThis = this;

    oThis.cacheType = cacheManagementConst.memcached;
  }

  /**
   * Set cache keys.
   *
   * @sets oThis.cacheKeys
   *
   * @private
   */
  _setCacheKeys() {
    const oThis = this;

    for (let index = 0; index < oThis.userIds.length; index++) {
      oThis.cacheKeys[oThis._cacheKeyPrefix() + '_cmm_us_uid_' + oThis.userIds[index]] = oThis.userIds[index];
    }
  }

  /**
   * Set cache expiry in oThis.cacheExpiry.
   *
   * @sets oThis.cacheExpiry
   *
   * @private
   */
  _setCacheExpiry() {
    const oThis = this;

    oThis.cacheExpiry = cacheManagementConst.largeExpiryTimeInterval; // 24 hours ;
  }

  /**
   * Fetch data from source.
   *
   * @param {array} cacheMissIds
   *
   * @return {Result}
   */
  async fetchDataFromSource(cacheMissIds) {
    const fetchByUserIdsRsp = await new UserStatModel().fetchByUserIds(cacheMissIds);

    return responseHelper.successWithData(fetchByUserIdsRsp);
  }
}

module.exports = UserStatByUserIds;
