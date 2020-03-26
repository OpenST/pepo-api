const rootPrefix = '../../../..',
  CacheMultiBase = require(rootPrefix + '/lib/cacheManagement/multi/Base'),
  MeetingsModel = require(rootPrefix + '/app/models/mysql/meeting/Meeting'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cacheManagementConstants = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class for meeting obj by meeting ids cache.
 *
 * @class MeetingByIds
 */
class MeetingByIds extends CacheMultiBase {
  /**
   * Init params in oThis.
   *
   * @param {object} params
   * @param {array<number>} params.ids
   *
   * @private
   */
  _initParams(params) {
    const oThis = this;

    oThis.ids = params.ids;
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

    oThis.cacheType = cacheManagementConstants.memcached;
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

    for (let index = 0; index < oThis.ids.length; index++) {
      oThis.cacheKeys[oThis._cacheKeyPrefix() + '_cmm_m_ids_' + oThis.ids[index]] = oThis.ids[index];
    }
  }

  /**
   * Set cache expiry.
   *
   * @sets oThis.cacheExpiry
   *
   * @private
   */
  _setCacheExpiry() {
    const oThis = this;

    oThis.cacheExpiry = cacheManagementConstants.mediumExpiryTimeInterval; // 60 minutes
  }

  /**
   * Fetch data from source for cache miss ids.
   *
   * @param cacheMissIds
   *
   * @return {Promise<*>}
   */
  async fetchDataFromSource(cacheMissIds) {
    const fetchByIdsRsp = await new MeetingsModel().fetchByIds(cacheMissIds);

    return responseHelper.successWithData(fetchByIdsRsp);
  }
}

module.exports = MeetingByIds;
