/**
 * This module helps in Searching Gifs from Giphy and caching responses
 *
 * @module lib/giphy/Search.js
 */
const rootPrefix = '../..',
  GifsByKeyword = require(rootPrefix + '/lib/cacheManagement/single/GifsByKeyword'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  giphyWrapper = require(rootPrefix + '/lib/giphy/sdkWrapper');

/**
 * Class to Search Gifs from cache and then from Giphy
 *
 * @class
 */
class GiphyGifSearch {
  /**
   * Constructor
   *
   * @param query
   * @param pageNumber
   */
  constructor(query, pageNumber) {
    const oThis = this;
    oThis.query = query;
    oThis.pageNumber = pageNumber ? pageNumber : 1;
    oThis.pageSize = 10;
  }

  /**
   * Get gifs from Giphy
   *
   * @returns {Promise<*|result>}
   */
  async getGifs() {
    const oThis = this;

    // First look for cached images if found in cache use them.
    let giphyPageNumber = parseInt(((oThis.pageNumber - 1) * oThis.pageSize) / giphyWrapper.giphyPageSize);

    let gifsCacheObj = new GifsByKeyword({ query: oThis.query, pageNumber: giphyPageNumber }),
      gifsResponse = await gifsCacheObj.fetch();

    if (gifsResponse.isSuccess() && null != gifsResponse.data && null != gifsResponse.data.gifs) {
      let numberOfPages = parseInt(giphyWrapper.giphyPageSize / oThis.pageSize);

      let offset = parseInt((oThis.pageNumber - 1) % numberOfPages) * oThis.pageSize,
        smallSetData = gifsResponse.data.gifs.slice(offset, offset + oThis.pageSize);

      return responseHelper.successWithData({ gifs: smallSetData });
    }

    return responseHelper.successWithData({ gifs: [] });
  }
}

module.exports = GiphyGifSearch;
