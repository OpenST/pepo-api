/**
 * This service helps in getting trending Gifs
 *
 * @module app/services/gifs/Trending
 */

const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  GifsTrendingCache = require(rootPrefix + '/lib/cacheManagement/single/GifsTrending'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class GifsTrending extends ServiceBase {
  /**
   * @param {Object} params
   * @param {Number} params.page_number
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.pageNumber = params.page_number;
  }

  /**
   * perform - perform get gifs
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    let response = await oThis._searchGifs();

    return responseHelper.successWithData(response);
  }

  /**
   * Search Gifs for given query
   *
   * @returns {Promise<*>}
   * @private
   */
  async _searchGifs() {
    const oThis = this;
    let resp = await new GifsTrendingCache({ pageNumber: oThis.pageNumber }).fetch();

    if (resp.isFailure()) {
      logger.error('Error while fetching gifs');
      return Promise.reject(resp);
    }

    return resp.data;
  }
}

module.exports = GifsTrending;
