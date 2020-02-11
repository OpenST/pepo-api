const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UserVideoSingleFormatter = require(rootPrefix + '/lib/formatter/strategy/userVideos/Single'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for user video list formatter.
 *
 * @class UserVideoListFormatter
 */
class UserVideoListFormatter extends BaseFormatter {
  /**
   * Constructor for user video list formatter.
   *
   * @param {object} params
   * @param {array} params.userVideoList
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.userVideoList = params[entityTypeConstants.userVideoList];
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    if (!CommonValidators.validateArray(oThis.userVideoList)) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_e_uv_l_1',
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

    for (let index = 0; index < oThis.userVideoList.length; index++) {
      const formattedFeedRsp = new UserVideoSingleFormatter({ userVideo: oThis.userVideoList[index] }).perform();

      if (formattedFeedRsp.isFailure()) {
        return formattedFeedRsp;
      }

      finalResponse.push(formattedFeedRsp.data);
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = UserVideoListFormatter;
