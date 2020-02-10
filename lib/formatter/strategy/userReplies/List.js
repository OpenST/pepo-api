const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserReplySingleFormatter = require(rootPrefix + '/lib/formatter/strategy/userReplies/Single'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for user reply list formatter.
 *
 * @class UserReplyListFormatter
 */
class UserReplyListFormatter extends BaseFormatter {
  /**
   * Constructor for user reply list formatter.
   *
   * @param {object} params
   * @param {array} params.userReplyList
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.userReplyList = params[entityTypeConstants.userReplyList];
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    if (!CommonValidators.validateArray(oThis.userReplyList)) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_s_ur_l_1',
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

    for (let index = 0; index < oThis.userReplyList.length; index++) {
      const formattedVideoReplyRsp = new UserReplySingleFormatter({
        userReply: oThis.userReplyList[index]
      }).perform();

      if (formattedVideoReplyRsp.isFailure()) {
        return formattedVideoReplyRsp;
      }

      finalResponse.push(formattedVideoReplyRsp.data);
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = UserReplyListFormatter;
