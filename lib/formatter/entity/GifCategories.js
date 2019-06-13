/**
 * Formatter for GifCategories entity to convert keys to snake case.
 *
 * @module lib/formatter/entity/GifCategories
 */

const rootPrefix = '../../..',
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  gifCategoryConstant = require(rootPrefix + '/lib/globalConstant/gifCategory');

/**
 * Class for GifCategories formatter.
 *
 * @class
 */
class GifCategoriesFormatter {
  /**
   * Constructor for GifCategories formatter.
   *
   * @param {Object} params
   * @param {Object} params.gifCategories
   *
   * @param {String} params.gifCategories.id
   * @param {String} params.gifCategories.name
   * @param {Object} params.gifCategories.gifId
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.gifCategories = params.gifCategories;
  }

  /**
   * Perform
   *
   * @return {{}}
   */
  perform() {
    const oThis = this;

    let finalResponse = [];
    for (let index = 0; index < oThis.gifCategories.length; index++) {
      let obj = oThis.gifCategories[index],
        formattedObj = {
          id: obj.id,
          name: obj.name,
          gif_id: obj.gifId,
          url: gifCategoryConstant.getUrlFor(obj.kind, obj.name)
        };

      finalResponse.push(formattedObj);
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = GifCategoriesFormatter;
