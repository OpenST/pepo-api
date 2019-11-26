const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  VideoDetailSingleFormatter = require(rootPrefix + '/lib/formatter/strategy/videoDetails/Single'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for videos map formatter.
 *
 * @class videosMapFormatter
 */
class videosMapFormatter extends BaseFormatter {
  /**
   * Constructor for videos map formatter.
   *
   * @param {object} params
   * @param {object} params.videoDetailsMap
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.videoDetailsMap = params.videoDetailsMap;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    if (!CommonValidators.validateObject(oThis.videoDetailsMap)) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_s_vd_m_1',
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
  async _format() {
    const oThis = this;

    const finalResponse = {};

    for (const videoDetailId in oThis.videoDetailsMap) {
      const videoDetailObj = oThis.videoDetailsMap[videoDetailId],
        formattedVideoDetailRsp = await new VideoDetailSingleFormatter({ videoDetail: videoDetailObj }).perform();

      if (formattedVideoDetailRsp.isFailure()) {
        return formattedVideoDetailRsp;
      }

      finalResponse[videoDetailId] = formattedVideoDetailRsp.data;
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = videosMapFormatter;
