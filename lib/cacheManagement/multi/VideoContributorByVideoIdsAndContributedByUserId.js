const rootPrefix = '../../..',
  CacheMultiBase = require(rootPrefix + '/lib/cacheManagement/multi/Base'),
  VideoContributorModel = require(rootPrefix + '/app/models/mysql/VideoContributor'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement');

class VideoContributorByVideoIdsAndContributedByUserId extends CacheMultiBase {
  /**
   * Constructor for VideoContributorByVideoIdsAndContributedByUserId.
   *
   * @param {object} params
   * @param {array} params.videoIds
   * @param {integer} params.contributedByUserId
   *
   * @augments CacheMultiBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);
  }

  /**
   * Init Params in oThis
   *
   * @param params
   * @private
   */
  _initParams(params) {
    const oThis = this;

    oThis.contributedByUserId = params.contributedByUserId;
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

    oThis.useObject = false;
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
   * set cache expiry in oThis.cacheExpiry and return it
   */
  _setCacheExpiry() {
    const oThis = this;
    oThis.cacheExpiry = cacheManagementConst.largeExpiryTimeInterval; // 24 hours ;
  }

  /**
   * set cache keys
   */
  _setCacheKeys() {
    const oThis = this;

    for (let i = 0; i < oThis.videoIds.length; i++) {
      oThis.cacheKeys[
        oThis._cacheKeyPrefix() + '_cmm_vcbvi_' + oThis.contributedByUserId + '_uids_' + oThis.videoIds[i]
      ] =
        oThis.videoIds[i];
    }
  }

  /**
   * Set cache expiry in oThis.cacheExpiry and return it.
   *
   * @sets oThis.cacheExpiry
   *
   * @return {number}
   */
  setCacheExpiry() {
    const oThis = this;

    oThis.cacheExpiry = cacheManagementConst.mediumExpiryTimeInterval;

    return oThis.cacheExpiry;
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

    // This value is only returned if cache is not set.
    const videoContributionsResp = await new VideoContributorModel().fetchByVideoIdAndContributedByUserId(
      cacheMissIds,
      oThis.contributedByUserId
    );

    return responseHelper.successWithData(videoContributionsResp);
  }
}

module.exports = VideoContributorByVideoIdsAndContributedByUserId;
