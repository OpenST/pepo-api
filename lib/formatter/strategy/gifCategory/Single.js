const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  gifCategoryConstants = require(rootPrefix + '/lib/globalConstant/gifCategory');

/**
 * Class for for single gif category entity to convert keys to snake case.
 *
 * @class GifCategorySingleFormatter
 */
class GifCategorySingleFormatter extends BaseFormatter {
  /**
   * Constructor for single gif category entity to convert keys to snake case.
   *
   * @param {object} params
   *
   * @param {object} params.gifCategory
   * @param {string} params.gifCategory.id
   * @param {string} params.gifCategory.name
   * @param {object} params.gifCategory.gifId
   * @param {object} params.gifCategory.kind
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.gifCategory = params.gifCategory;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const gifCategoryKeyConfig = {
      id: { isNullAllowed: false },
      name: { isNullAllowed: false },
      kind: { isNullAllowed: false },
      gifId: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.gifCategory, gifCategoryKeyConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {result}
   * @private
   */
  _format() {
    const oThis = this;

    return responseHelper.successWithData({
      id: oThis.gifCategory.id,
      name: oThis.gifCategory.name,
      gif_id: oThis.gifCategory.gifId,
      url: gifCategoryConstants.getUrlFor(oThis.gifCategory.kind, oThis.gifCategory.name)
    });
  }
}

module.exports = GifCategorySingleFormatter;
