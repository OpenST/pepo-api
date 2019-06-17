/**
 * This service helps in getting trending Gifs
 *
 * @module app/services/gifs/Trending
 */

const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  GifsTrendingCache = require(rootPrefix + '/lib/cacheManagement/single/GifsTrending'),
  pagination = require(rootPrefix + '/lib/globalConstant/pagination'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class GifsTrending extends ServiceBase {
  /**
   * @param {Object} params
   * @param {Number} params.page_number
   * @param {String} [params.pagination_identifier]
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;
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

    let response = await oThis._getGifs();

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
  async _getGifs() {
    const oThis = this;

    let resp = await new GifsTrendingCache({ pageNumber: oThis.pageNumber }).fetch();

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

module.exports = GifsTrending;
