const rootPrefix = '../../..',
  ReplyDetailsModel = require(rootPrefix + '/app/models/mysql/ReplyDetail'),
  CacheMultiBase = require(rootPrefix + '/lib/cacheManagement/multi/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class to get distinct reply creators on videos
 *
 * @class VideoDistinctReplyCreators
 */
class VideoDistinctReplyCreators extends CacheMultiBase {
  /**
   * Init params in oThis.
   *
   * @param {object} params
   * @param {array<number>} params.videoIds
   * @param {string} params.entityKind
   *
   * @sets oThis.entityIds, oThis.entityKind
   *
   * @private
   */
  _initParams(params) {
    const oThis = this;

    oThis.videoIds = params.videoIds;
  }

  /**
   * Set use object
   *
   * @sets oThis.useObject
   *
   * @private
   */
  _setUseObject() {
    const oThis = this;

    oThis.useObject = true;
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

    for (let ind = 0; ind < oThis.videoIds.length; ind++) {
      oThis.cacheKeys[oThis._cacheKeyPrefix() + `_cmm_vdrc_${oThis.videoIds[ind]}`] = oThis.videoIds[ind];
    }
  }

  /**
   * Set cache expiry in oThis.cacheExpiry
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
   * Fetch data from source
   *
   * @returns {result}
   */
  async fetchDataFromSource() {
    const oThis = this;

    const fetchByVideoIdsRsp = await new ReplyDetailsModel().fetchDistinctReplyCreatorsByParent(oThis.videoIds);

    return responseHelper.successWithData(fetchByVideoIdsRsp);
  }
}

module.exports = VideoDistinctReplyCreators;
