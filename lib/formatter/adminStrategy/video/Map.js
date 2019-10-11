const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  VideoSingleFormatter = require(rootPrefix + '/lib/formatter/adminStrategy/video/Single'),
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
   * @param {object} params.videoMap
   * @param {object} [params.imageMap]
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.videoMap = params.videoMap;
    oThis.imageMap = params.imageMap;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    if (!CommonValidators.validateObject(oThis.videoMap)) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_as_v_m_1',
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

    const finalResponse = {};

    for (const videoId in oThis.videoMap) {
      const videoObj = oThis.videoMap[videoId],
        formattedVideoRsp = new VideoSingleFormatter({ video: videoObj, imageMap: oThis.imageMap }).perform();

      if (formattedVideoRsp.isFailure()) {
        return formattedVideoRsp;
      }

      finalResponse[videoId] = formattedVideoRsp.data;
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = videosMapFormatter;
