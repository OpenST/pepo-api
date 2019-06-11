/**
 * This service helps in searching Gifs for given search query
 *
 * @module app/services/gifs/Search
 */

const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  GifsSearchWrapper = require(rootPrefix + '/lib/giphy/Search'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class GifsSearch extends ServiceBase {
  /**
   * @param {Object} params
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
    let resp = await new GifsSearchWrapper(oThis.query, oThis.pageNumber).getGifs();

    if (resp.isFailure()) {
      logger.error('Error while fetching gifs');
      return Promise.reject(resp);
    }

    return resp.data;
  }
}

module.exports = GifsSearch;
