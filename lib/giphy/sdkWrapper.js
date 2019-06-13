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
   * Method to search trending Gifs from Giphy
   *
   * @param pageNumber
   * @return {Promise<void>}
   */
  async searchTrending(pageNumber) {
    const oThis = this;

    let formattedResp = [];
    await oThis.apiClient
      .trending('gifs', {
        limit: oThis.giphyPageSize,
        offset: oThis.searchOffset(pageNumber)
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
          kind: gifObj.type,
          id: gifObj.id,
          fixed_width: gifObj.images.fixed_width,
          fixed_width_downsampled: gifObj.images.fixed_width_downsampled,
          fixed_width_small: gifObj.images.fixed_width_small
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
