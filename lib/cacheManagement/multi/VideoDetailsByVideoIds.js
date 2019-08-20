/**
 * Multi Cache for video details by ids
 *
 * @module lib/cacheManagement/multi/VideoDetailsByIds
 */

const rootPrefix = '../../..',
  VideoDetailsModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  CacheMultiBase = require(rootPrefix + '/lib/cacheManagement/multi/Base'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class VideoDetailsByVideoIds extends CacheMultiBase {
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

    oThis.videoIds = params.videoIds;
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

    for (let ind = 0; ind < oThis.videoIds.length; ind++) {
      oThis.cacheKeys[oThis._cacheKeyPrefix() + '_cmm_vd_vdo_id_' + oThis.videoIds[ind]] = oThis.videoIds[ind];
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

    let fetchByIdsRsp = await new VideoDetailsModel().fetchByVideoIds(cacheMissIds);

    return responseHelper.successWithData(fetchByIdsRsp);
  }
}

module.exports = VideoDetailsByVideoIds;
