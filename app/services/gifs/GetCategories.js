/**
 * This service helps in getting all categories of Gifs.
 *
 * @module app/services/gifs/GetCategories
 */

const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  GifCategoriesCacheKlass = require(rootPrefix + '/lib/cacheManagement/single/GifCategories'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class GetCategories extends ServiceBase {
  /**
   *
   * @constructor
   */
  constructor() {
    super({});
  }

  /**
   * perform - perform get gif categories
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    let response = await oThis._fetchGifCategories();

    return responseHelper.successWithData(response);
  }

  /**
   * Fetch All Gif Categories
   *
   * @returns {Promise<*>}
   * @private
   */
  async _fetchGifCategories() {
    const oThis = this;
    let resp = await new GifCategoriesCacheKlass().fetch();

    if (resp.isFailure()) {
      logger.error('Error while fetching gifs');
      return Promise.reject(resp);
    }

    // Format data
    let formattedData = { gifCategories: [], gifMap: {} };
    for (let i = 0; i < resp.data.gifCategories.length; i++) {
      let obj = resp.data.gifCategories[i];
      formattedData.gifCategories.push(obj);
      formattedData.gifMap[obj.gifId] = obj.gifData;
    }

    return formattedData;
  }
}

module.exports = GetCategories;
