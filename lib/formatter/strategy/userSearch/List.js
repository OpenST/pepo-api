const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserSearchSingleFormatter = require(rootPrefix + '/lib/formatter/strategy/userSearch/Single'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for user search list formatter.
 *
 * @class UserSearchListFormatter
 */
class UserSearchListFormatter extends BaseFormatter {
  /**
   * Constructor for userSearch list formatter.
   *
   * @param {object} params
   * @param {array} params.userSearchList
   *
   * @param {number} params.userSearchList.id
   * @param {number} params.userSearchList.updated_at
   * @param {object} params.userSearchList.payload
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis[entityTypeConstants.userSearchList] = params[entityTypeConstants.userSearchList];
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    if (!CommonValidators.validateArray(oThis[entityTypeConstants.userSearchList])) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_e_us_l_1',
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

    for (let index = 0; index < oThis[entityTypeConstants.userSearchList].length; index++) {
      const formattedFeedRsp = new UserSearchSingleFormatter({
        userSearchResult: oThis[entityTypeConstants.userSearchList][index]
      }).perform();

      if (formattedFeedRsp.isFailure()) {
        return formattedFeedRsp;
      }

      finalResponse.push(formattedFeedRsp.data);
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = UserSearchListFormatter;
