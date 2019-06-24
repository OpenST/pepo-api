const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  GifCategorySingleFormatter = require(rootPrefix + '/lib/formatter/strategy/gifCategory/Single'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for gif category list formatter.
 *
 * @class GifCategoryListFormatter
 */
class GifCategoryListFormatter extends BaseFormatter {
  /**
   * Constructor for gif category list formatter.
   *
   * @param {object} params
   * @param {array} params.gifCategories
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
   * Validate the input object.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    if (!CommonValidators.validateArray(oThis.gifCategories)) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_e_gc_l_1',
        api_error_identifier: 'entity_formatting_failed',
        debug_options: {
          array: oThis.gifCategories
        }
      });
    }

    return responseHelper.successWithData({});
  }

  /**
   * Format the input object.
   *
   * @returns {result}
   * @private
   */
  _format() {
    const oThis = this;

    const finalResponse = [];

    for (let index = 0; index < oThis.gifCategories.length; index++) {
      const gifCategoryObj = oThis.gifCategories[index],
        formattedGifCategory = new GifCategorySingleFormatter({ gifCategory: gifCategoryObj }).perform();

      if (formattedGifCategory.isFailure()) {
        return formattedGifCategory;
      }

      finalResponse.push(formattedGifCategory.data);
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = GifCategoryListFormatter;
