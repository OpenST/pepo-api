/**
 * Module to cache Gifs data by Keywords.
 *
 * @module lib/cacheManagement/single/GifsByKeyword
 */
const rootPrefix = '../../..',
  CacheManagementBase = require(rootPrefix + '/lib/cacheManagement/single/Base'),
  giphyWrapper = require(rootPrefix + '/lib/giphy/sdkWrapper'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  cacheManagementConst = require(rootPrefix + '/lib/globalConstant/cacheManagement');

/**
 * Class to get Gifs By Keywords from cache.
 *
 * @class GifsByKeyword
 */
class GifsByKeyword extends CacheManagementBase {
  /**
   * Constructor to get gifs by keyword
   *
   * @param {object} params
   * @param {String} params.query
   * @param {Integer} params.pageNumber
   *
   * @augments CacheManagementBase
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

    oThis.query = params.query;
    oThis.pageNumber = params.pageNumber;
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
   * @returns {string}
   */
  _setCacheType() {
    const oThis = this;

    oThis.cacheType = cacheManagementConst.memcached;
  }

  /**
   * Set cache key.
   *
   * @sets oThis.cacheKey
   *
   * @returns {string}
   */
  setCacheKey() {
    const oThis = this;

    oThis.cacheKey = encodeURI(oThis._cacheKeyPrefix() + `_gifs_${oThis.query}_${oThis.pageNumber}`);

    return oThis.cacheKey;
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

    oThis.cacheExpiry = cacheManagementConst.largeExpiryTimeInterval;

    return oThis.cacheExpiry;
  }

  /**
   * Fetch data from source
   *
   * @return {Result}
   */
  async fetchDataFromSource() {
    const oThis = this;

    let gifObjs = await giphyWrapper.searchGifs(oThis.query, oThis.pageNumber);
    if (null == gifObjs || gifObjs.length <= 0) {
      return responseHelper.error({
        internal_error_identifier: 'l_cm_s_gbk_1',
        api_error_identifier: 'resource_not_found'
      });
    }

    return responseHelper.successWithData({ gifs: gifObjs });
  }
}

module.exports = GifsByKeyword;
