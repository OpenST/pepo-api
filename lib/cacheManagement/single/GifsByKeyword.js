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
   * @param {Integer} params.pageSize
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
    oThis.pageNumber = params.pageNumber ? params.pageNumber : 1;
    oThis.pageSize = params.pageSize ? params.pageSize : 18;
    oThis.giphyPageNumber = parseInt(((oThis.pageNumber - 1) * oThis.pageSize) / giphyWrapper.giphyPageSize);
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

    oThis.cacheKey = encodeURI(oThis._cacheKeyPrefix() + `_gifs_${oThis.query}_${oThis.giphyPageNumber}`);

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
   * Fetch data from cache, in case of cache miss calls sub class method to fetch data from source
   *
   * @returns {Promise<Result>}: On success, data.value has value. On failure, error details returned.
   */
  async fetch() {
    const oThis = this;

    let smallSetData = [],
      gifsResponse = await super.fetch();

    if (gifsResponse.isSuccess() && null != gifsResponse.data && null != gifsResponse.data.gifs) {
      let numberOfPages = parseInt(giphyWrapper.giphyPageSize / oThis.pageSize);

      let offset = parseInt((oThis.pageNumber - 1) % numberOfPages) * oThis.pageSize;

      smallSetData = gifsResponse.data.gifs.slice(offset, offset + oThis.pageSize);
    }

    return responseHelper.successWithData({ gifs: smallSetData });
  }

  /**
   * Fetch data from source
   *
   * @return {Result}
   */
  async fetchDataFromSource() {
    const oThis = this;

    let gifObjs = await giphyWrapper.searchGifs(oThis.query, oThis.giphyPageNumber);
    if (null == gifObjs || gifObjs.length <= 0) {
      return responseHelper.successWithData({ gifs: [] });
    }

    return responseHelper.successWithData({ gifs: gifObjs });
  }
}

module.exports = GifsByKeyword;
