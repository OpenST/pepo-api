/**
 * Multi Cache for video ids by tag ids
 *
 *
 * @module lib/cacheManagement/multi/VideoIdsByTagIds
 */

const rootPrefix = '../../..',
  VideoTagsModel = require(rootPrefix + '/app/models/mysql/VideoTag'),
  CacheMultiBase = require(rootPrefix + '/lib/cacheManagement/multi/Base'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class VideoIdsByTagIds extends CacheMultiBase {
  /**
   * constructor
   *
   * @param params
   * @param {Array} params.tagIds: tagIds
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

    oThis.tagIds = params.tagIds;
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

    for (let ind = 0; ind < oThis.tagIds.length; ind++) {
      oThis.cacheKeys[oThis._cacheKeyPrefix() + '_cmm_vtg_id_' + oThis.tagIds[ind]] = oThis.tagIds[ind];
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

    let fetchVideoIdsByTagIdsRsp = await new VideoTagsModel().fetchVideoIdsByTagIds(cacheMissIds);

    return responseHelper.successWithData(fetchVideoIdsByTagIdsRsp);
  }
}

module.exports = VideoIdsByTagIds;
