const rootPrefix = '../../..',
  TwitterUserModel = require(rootPrefix + '/app/models/mysql/TwitterUser'),
  CacheMultiBase = require(rootPrefix + '/lib/cacheManagement/multi/Base'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class TwitterUserByTwitterIds extends CacheMultiBase {
  /**
   * constructor
   *
   * @param params
   * @param {Array} params.twitterIds: twitterIds
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

    oThis.twitterIds = params.twitterIds;
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

    for (let i = 0; i < oThis.twitterIds.length; i++) {
      oThis.cacheKeys[oThis._cacheKeyPrefix() + '_cmm_twu_tid_' + oThis.twitterIds[i]] = oThis.twitterIds[i];
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
    const oThis = this;

    let fetchByTwitterIdsRsp = await new TwitterUserModel().fetchByTwitterIds(cacheMissIds);

    return responseHelper.successWithData(fetchByTwitterIdsRsp);
  }
}

module.exports = TwitterUserByTwitterIds;
