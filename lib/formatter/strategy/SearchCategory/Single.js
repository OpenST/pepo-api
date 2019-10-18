const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  responseEntityKey = require(rootPrefix + '/lib/globalConstant/responseEntityKey');

/**
 * Class for searchCategorySingle formatter.
 *
 * @class searchCategorySingleFormatter
 */
class searchCategorySingleFormatter extends BaseFormatter {
  /**
   * Constructor for searchCategory formatter.
   *
   * @param {object} params
   * @param {object} params.searchCategoryResult
   *
   * @param {number} params.searchCategoryResult.id
   * @param {number} params.searchCategoryResult.updated_at
   * @param {object} params.searchCategoryResult.kind
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.searchCategoryResult = params.searchCategoryResult;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const searchCategoryResultConfig = {
      id: { isNullAllowed: false },
      updatedAt: { isNullAllowed: false },
      kind: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.searchCategoryResult, searchCategoryResultConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {*|result}
   * @private
   */
  _format() {
    const oThis = this;

    const response = {
      id: oThis.searchCategoryResult.id,
      uts: oThis.searchCategoryResult.updatedAt,
      kind: oThis.searchCategoryResult.kind
    };

    if (oThis.searchCategoryResult.kind == 'user') {
      response.title = 'Trending People';
      response.result_array = responseEntityKey.userSearchResults;
    } else if (oThis.searchCategoryResult.kind == 'tag') {
      response.title = 'Trending Tags';
      response.result_array = responseEntityKey.tagSearchResults;
    }

    return responseHelper.successWithData(response);
  }
}

module.exports = searchCategorySingleFormatter;
