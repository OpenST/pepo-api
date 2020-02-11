const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ChannelVideoSingleFormatter = require(rootPrefix + '/lib/formatter/strategy/channelVideos/Single'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType');

/**
 * Class for channel video list formatter.
 *
 * @class ChannelVideoListFormatter
 */
class ChannelVideoListFormatter extends BaseFormatter {
  /**
   * Constructor for channel video list formatter.
   *
   * @param {object} params
   * @param {array} params.channelVideoList
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.channelVideoList = params[entityTypeConstants.channelVideoList];
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    if (!CommonValidators.validateArray(oThis.channelVideoList)) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_s_cv_l_1',
        api_error_identifier: 'entity_formatting_failed',
        debug_options: { channelVideoList: oThis.channelVideoList }
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

    for (let index = 0; index < oThis.channelVideoList.length; index++) {
      const formattedFeedRsp = new ChannelVideoSingleFormatter({
        channelVideo: oThis.channelVideoList[index]
      }).perform();

      if (formattedFeedRsp.isFailure()) {
        return formattedFeedRsp;
      }

      finalResponse.push(formattedFeedRsp.data);
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = ChannelVideoListFormatter;
