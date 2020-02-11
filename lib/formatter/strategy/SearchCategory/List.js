const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  SearchCategorySingleFormatter = require(rootPrefix + '/lib/formatter/strategy/SearchCategory/Single'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for SearchCategory list formatter.
 *
 * @class SearchCategoryListFormatter
 */
class SearchCategoryListFormatter extends BaseFormatter {
  /**
   * Constructor for searchCategoriesList list formatter.
   *
   * @param {object} params
   * @param {array} params.searchCategoriesList
   *
   * @param {number} params.searchCategoriesList.id
   * @param {number} params.searchCategoriesList.updated_at
   * @param {object} params.searchCategoriesList.kind
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis[entityTypeConstants.searchCategoriesList] = params[entityTypeConstants.searchCategoriesList];
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    if (!CommonValidators.validateArray(oThis[entityTypeConstants.searchCategoriesList])) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_e_sc_l_1',
        api_error_identifier: 'entity_formatting_failed',
        debug_options: {}
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

    for (let index = 0; index < oThis[entityTypeConstants.searchCategoriesList].length; index++) {
      const formattedFeedRsp = new SearchCategorySingleFormatter({
        searchCategoryResult: oThis[entityTypeConstants.searchCategoriesList][index]
      }).perform();

      if (formattedFeedRsp.isFailure()) {
        return formattedFeedRsp;
      }

      finalResponse.push(formattedFeedRsp.data);
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = SearchCategoryListFormatter;
