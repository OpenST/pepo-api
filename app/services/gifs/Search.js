/**
 * This service helps in searching Gifs for given search query
 *
 * @module app/services/gifs/Search
 */

const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  GifsCacheKlass = require(rootPrefix + '/lib/cacheManagement/single/GifsByKeyword'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class GifsSearch extends ServiceBase {
  /**
   * @param {Object} params
   * @param {String} params.query
   * @param {Number} params.page_number
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.query = params.query;
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
    let resp = await new GifsCacheKlass({ query: oThis.query, pageNumber: oThis.pageNumber }).fetch();

    if (resp.isFailure()) {
      logger.error('Error while fetching gifs');
      return Promise.reject(resp);
    }

    return resp.data;
  }
}

module.exports = GifsSearch;
