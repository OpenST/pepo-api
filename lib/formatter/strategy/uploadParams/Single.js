const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class to get Upload Params Single formatter.
 *
 * @class UploadParamsSingleFormatter
 */
class UploadParamsSingleFormatter extends BaseFormatter {
  /**
   * Constructor for get Upload Params formatter.
   *
   * @param {object} params.uploadParams
   *
   * @param {string} params.uploadParams.postUrl
   * @param {hash} params.uploadParams.postFields
   * @param {string} params.uploadParams.s3Url
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.uploadParams = params.uploadParams;

    oThis.postFields = oThis.uploadParams.postFields;
    oThis.postUrl = oThis.uploadParams.postUrl;
    oThis.s3Url = oThis.uploadParams.s3Url;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const paramsKeyConfig = {
      postUrl: { isNullAllowed: false },
      postFields: { isNullAllowed: false },
      s3Url: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.uploadParams, paramsKeyConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {*|result|*}
   * @private
   */
  _format() {
    const oThis = this,
      postFieldsArray = [];

    for (let field in oThis.postFields) {
      postFieldsArray.push({
        ['key']: field,
        ['value']: oThis.postFields[field]
      });
    }

    return responseHelper.successWithData({
      post_url: oThis.postUrl,
      post_fields: postFieldsArray,
      s3_url: oThis.s3Url
    });
  }
}

module.exports = UploadParamsSingleFormatter;
