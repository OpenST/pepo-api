const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ImageSingleFormatter = require(rootPrefix + '/lib/formatter/strategy/image/Single'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for images map formatter.
 *
 * @class ImagesMapFormatter
 */
class ImagesMapFormatter extends BaseFormatter {
  /**
   * Constructor for images map formatter.
   *
   * @param {object} params
   * @param {object} params.imageMap
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

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

    if (!CommonValidators.validateObject(oThis.imageMap)) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_s_i_m_1',
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

    for (const imageId in oThis.imageMap) {
      const imageObj = oThis.imageMap[imageId],
        formattedImageRsp = new ImageSingleFormatter({ image: imageObj }).perform();

      if (formattedImageRsp.isFailure()) {
        return formattedImageRsp;
      }

      finalResponse[imageId] = formattedImageRsp.data;
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = ImagesMapFormatter;
