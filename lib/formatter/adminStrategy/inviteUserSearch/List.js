const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  InviteUserSearchSingleFormatter = require(rootPrefix + '/lib/formatter/adminStrategy/inviteUserSearch/Single'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  adminEntityType = require(rootPrefix + '/lib/globalConstant/adminEntityType');

/**
 * Class for invite user search list formatter.
 *
 * @class InviteUserSearchListFormatter
 */
class InviteUserSearchListFormatter extends BaseFormatter {
  /**
   * Constructor for invite user search list formatter.
   *
   * @param {object} params
   * @param {array} params.inviteUserSearchList
   *
   * @param {number} params.inviteUserSearchList.id
   * @param {number} params.inviteUserSearchList.updated_at
   * @param {object} params.inviteUserSearchList.payload
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis[adminEntityType.inviteUserSearchList] = params[adminEntityType.inviteUserSearchList];
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    if (!CommonValidators.validateArray(oThis[adminEntityType.inviteUserSearchList])) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_as_ius_l_1',
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

    for (let index = 0; index < oThis[adminEntityType.inviteUserSearchList].length; index++) {
      const formattedFeedRsp = new InviteUserSearchSingleFormatter({
        inviteUserSearchResult: oThis[adminEntityType.inviteUserSearchList][index]
      }).perform();

      if (formattedFeedRsp.isFailure()) {
        return formattedFeedRsp;
      }

      finalResponse.push(formattedFeedRsp.data);
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = InviteUserSearchListFormatter;
