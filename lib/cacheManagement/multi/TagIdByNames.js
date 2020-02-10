const rootPrefix = '../../..',
  TagModel = require(rootPrefix + '/app/models/mysql/Tag'),
  CacheMultiBase = require(rootPrefix + '/lib/cacheManagement/multi/Base'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class TagIdByTagNamesIds extends CacheMultiBase {
  /**
   * constructor
   *
   * @param params
   * @param {Array} params.names: names
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

    oThis.names = params.names;
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

    for (let i = 0; i < oThis.names.length; i++) {
      oThis.cacheKeys[oThis._cacheKeyPrefix() + '_cmm_tibtn_' + oThis.names[i].toLowerCase()] = oThis.names[i];
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
    let fetchByIdsRsp = await new TagModel().getTagIds(cacheMissIds);

    return responseHelper.successWithData(fetchByIdsRsp);
  }
}

module.exports = TagIdByTagNamesIds;
