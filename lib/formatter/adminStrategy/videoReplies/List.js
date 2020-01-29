const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  VideoReplySingleFormatter = require(rootPrefix + '/lib/formatter/adminStrategy/videoReplies/Single'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for video reply list formatter.
 *
 * @class AdminVideoReplyListFormatter
 */
class AdminVideoReplyListFormatter extends BaseFormatter {
  /**
   * Constructor for video reply list formatter.
   *
   * @param {object} params
   * @param {array} params.videoReplyList
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.videoReplyList = params[entityTypeConstants.videoReplyList];
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    if (!CommonValidators.validateArray(oThis.videoReplyList)) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_s_as_vr_l_1',
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

    for (let index = 0; index < oThis.videoReplyList.length; index++) {
      const formattedVideoReplyRsp = new VideoReplySingleFormatter({
        videoReply: oThis.videoReplyList[index]
      }).perform();

      if (formattedVideoReplyRsp.isFailure()) {
        return formattedVideoReplyRsp;
      }

      finalResponse.push(formattedVideoReplyRsp.data);
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = AdminVideoReplyListFormatter;
