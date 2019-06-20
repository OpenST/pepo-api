/**
 * Formatter for GifCategories entity to convert keys to snake case.
 *
 * @module lib/formatter/entity/GifCategories
 */

const rootPrefix = '../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  gifCategoryConstants = require(rootPrefix + '/lib/globalConstant/gifCategory');

/**
 * Class for GifCategories formatter.
 *
 * @class GifCategoriesFormatter
 */
class GifCategoriesFormatter extends BaseFormatter {
  /**
   * Constructor for GifCategories formatter.
   *
   * @param {object} params
   * @param {array} params.gifCategories
   *
   * @param {string} params.gifCategories[].id
   * @param {string} params.gifCategories[].name
   * @param {object} params.gifCategories[].gifId
   * @param {object} params.gifCategories[].kind
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.gifCategories = params.gifCategories;
  }

  /**
   * Validate the input objects.
   *
   * @param {object} gifCategoryObj
   *
   * @returns {result}
   */
  validate(gifCategoryObj) {
    const oThis = this;

    const gifCategoriesKeyConfig = {
      id: { isNullAllowed: false },
      name: { isNullAllowed: false },
      kind: { isNullAllowed: false },
      gifId: { isNullAllowed: true }
    };

    return oThis._validateParameters(gifCategoryObj, gifCategoriesKeyConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {object}
   */
  format() {
    const oThis = this;

    const finalResponse = [];

    for (let index = 0; index < oThis.gifCategories.length; index++) {
      const gifCategoryObj = oThis.gifCategories[index];

      const validationResponse = oThis.validate(gifCategoryObj);

      if (validationResponse.isFailure()) {
        return validationResponse;
      }

      const formattedObj = {
        id: gifCategoryObj.id,
        name: gifCategoryObj.name,
        gif_id: gifCategoryObj.gifId,
        url: gifCategoryConstants.getUrlFor(gifCategoryObj.kind, gifCategoryObj.name)
      };

      finalResponse.push(formattedObj);
    }

    return responseHelper.successWithData({ finalResponse });
  }
}

module.exports = GifCategoriesFormatter;
