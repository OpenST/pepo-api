const rootPrefix = '../../../..',
  CacheMultiBase = require(rootPrefix + '/lib/cacheManagement/multi/Base'),
  MeetingsModel = require(rootPrefix + '/app/models/mysql/meeting/Meeting'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cacheManagementConstants = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class for meeting id by zoom meeting ids cache.
 *
 * @class MeetingIdByZoomMeetingIds
 */
class MeetingIdByZoomMeetingIds extends CacheMultiBase {
  /**
   * Init params in oThis.
   *
   * @param {object} params
   * @param {array<number>} params.zoomMeetingIds
   *
   * @private
   */
  _initParams(params) {
    const oThis = this;

    oThis.zoomMeetingIds = params.zoomMeetingIds;
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

    for (let index = 0; index < oThis.fetchByZoomMeetingIds.length; index++) {
      oThis.cacheKeys[oThis._cacheKeyPrefix() + '_cmm_m_zmi_' + oThis.zoomMeetingIds[index]] =
        oThis.zoomMeetingIds[index];
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
    const fetchByIdsRsp = await new MeetingsModel().fetchByZoomMeetingIds(cacheMissIds);

    return responseHelper.successWithData(fetchByIdsRsp);
  }
}

module.exports = MeetingIdByZoomMeetingIds;
