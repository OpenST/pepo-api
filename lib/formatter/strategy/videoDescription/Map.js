const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  VideoDescriptionSingleFormatter = require(rootPrefix + '/lib/formatter/strategy/videoDescription/Single'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for video description map formatter.
 *
 * @class VideoDescriptionMapFormatter
 */
class VideoDescriptionMapFormatter extends BaseFormatter {
  /**
   * Constructor for videos map formatter.
   *
   * @param {object} params
   * @param {object} params.videoDescriptionsMap
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    console.log('params------', params);

    oThis.videoDescriptionsMap = params.videoDescriptionsMap;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    if (!CommonValidators.validateObject(oThis.videoDescriptionsMap)) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_s_vds_m_1',
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

    for (const descriptionId in oThis.videoDescriptionsMap) {
      const videoDescription = oThis.videoDescriptionsMap[descriptionId];

      let formattedVideoDescriptionRsp = new VideoDescriptionSingleFormatter({
        videoDescription: videoDescription
      }).perform();

      if (formattedVideoDescriptionRsp.isFailure()) {
        return formattedVideoDescriptionRsp;
      }

      finalResponse[descriptionId] = formattedVideoDescriptionRsp.data;
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = VideoDescriptionMapFormatter;
