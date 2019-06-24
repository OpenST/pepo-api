/**
 * This service helps in searching Gifs for given search query
 *
 * @module app/services/gifs/Search
 */

const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  GifsCacheByKeyword = require(rootPrefix + '/lib/cacheManagement/single/GifsByKeyword'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  pagination = require(rootPrefix + '/lib/globalConstant/pagination'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class GifsSearch extends ServiceBase {
  /**
   * @param {Object} params
   * @param {String} params.query
   * @param {String} [params.pagination_identifier]
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.query = params.query;
    oThis.paginationIdentifier = params[pagination.paginationIdentifierKey] || null;

    oThis.pageNumber = null;
  }

  /**
   * perform - perform get gifs
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    let response = await oThis._searchGifs();

    return responseHelper.successWithData(oThis._finalResponse(response));
  }

  /**
   * Validate and sanitize specific params
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    if (oThis.paginationIdentifier) {
      let parsedPaginationParams = oThis._parsePaginationParams(oThis.paginationIdentifier);
      oThis.pageNumber = parsedPaginationParams.page; //override page
    } else {
      oThis.pageNumber = 1;
    }
  }

  /**
   * Search Gifs for given query
   *
   * @returns {Promise<*>}
   * @private
   */
  async _searchGifs() {
    const oThis = this;
    let resp = await new GifsCacheByKeyword({ query: oThis.query, pageNumber: oThis.pageNumber }).fetch();

    if (resp.isFailure()) {
      logger.error('Error while fetching gifs');
      return Promise.reject(resp);
    }

    return resp.data;
  }

  /**
   * Service Response
   *
   * @returns {Promise<void>}
   * @private
   */
  _finalResponse(response) {
    const oThis = this;

    let nextPagePayloadKey = {};

    if (response.gifs.length != 0) {
      nextPagePayloadKey[pagination.paginationIdentifierKey] = {
        page: oThis.pageNumber + 1
      };
    }

    let responseMetaData = {
      [pagination.nextPagePayloadKey]: nextPagePayloadKey
    };

    response.meta = responseMetaData;

    return response;
  }
}

module.exports = GifsSearch;
