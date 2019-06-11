/**
 * This SDK Wrapper helps in making requests for Gifs on Giphy.
 *
 * @module lib/giphy/sdkWrapper.js
 */
const GphApiClient = require('giphy-js-sdk-core');

const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

/**
 * Class for Giphy Sdk Wrapper
 *
 * @class
 */
class GiphySdkWrapper {
  /**
   * Constructor
   */
  constructor() {
    const oThis = this;
    oThis.apiKey = coreConstants.GIPHY_API_KEY;
    oThis.apiClient = GphApiClient(oThis.apiKey);
  }

  /**
   * Method to search Gifs from Giphy
   *
   * @param query
   * @param pageNumber
   * @returns {Promise<*>}
   */
  async searchGifs(query, pageNumber) {
    const oThis = this;

    let formattedResp = [];
    await oThis.apiClient
      .search('gifs', {
        q: query,
        limit: oThis.giphyPageSize,
        offset: oThis.searchOffset(pageNumber),
        sort: 'relevant'
      })
      .then((response) => {
        formattedResp = oThis.formatResponseData(response.data);
      })
      .catch((err) => {
        logger.debug('Error while fetching gifs: ', err);
      });

    return formattedResp;
  }

  /**
   * Format response Data from Giphy
   *
   * @param responseData
   * @returns {Array}
   */
  formatResponseData(responseData) {
    const formattedResponse = [];

    if (null != responseData) {
      responseData.forEach((gifObj) => {
        formattedResponse.push({
          type: gifObj.type,
          id: gifObj.id,
          downsized: gifObj.images.fixed_width,
          original: gifObj.images.original
        });
      });
    }

    return formattedResponse;
  }

  /**
   * Page size for giphy search request.
   *
   * @returns {number}
   */
  get giphyPageSize() {
    return 100;
  }

  /**
   * Search results offset
   *
   * @param pageNumber
   * @returns {number}
   */
  searchOffset(pageNumber) {
    const oThis = this;

    return pageNumber * oThis.giphyPageSize;
  }
}

module.exports = new GiphySdkWrapper();
