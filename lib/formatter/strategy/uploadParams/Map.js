const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UploadParamsSingleFormatter = require(rootPrefix + '/lib/formatter/strategy/uploadParams/Single'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for upload params map formatter.
 *
 * @class UploadParamsMapFormatter
 */
class UploadParamsMapFormatter extends BaseFormatter {
  /**
   * Constructor for upload params map formatter.
   *
   * @param {object} params
   * @param {object} params.uploadParamsMap
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.uploadParamsMap = params.uploadParamsMap;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    if (!CommonValidators.validateObject(oThis.uploadParamsMap)) {
      return responseHelper.error({
        internal_error_identifier: 'l_f_s_up_m_1',
        api_error_identifier: 'entity_formatting_failed',
        debug_options: { array: oThis.uploadParamsMap }
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

    for (const entity in oThis.uploadParamsMap) {
      const entityUploadParams = oThis.uploadParamsMap[entity];

      for (const file in entityUploadParams) {
        const formattedUploadParams = new UploadParamsSingleFormatter({
          uploadParams: entityUploadParams[file]
        }).perform();

        if (formattedUploadParams.isFailure()) {
          return formattedUploadParams;
        }

        finalResponse[entity] = finalResponse[entity] || {};
        finalResponse[entity][file] = formattedUploadParams.data;
      }
    }

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = UploadParamsMapFormatter;
