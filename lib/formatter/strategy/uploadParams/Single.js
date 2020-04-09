const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class to get upload params single formatter.
 *
 * @class UploadParamsSingleFormatter
 */
class UploadParamsSingleFormatter extends BaseFormatter {
  /**
   * Constructor for get upload params formatter.
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
    oThis.cdnUrl = oThis.uploadParams.cdnUrl;
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
      s3Url: { isNullAllowed: false },
      cdnUrl: { isNullAllowed: false }
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

    for (const field in oThis.postFields) {
      postFieldsArray.push({
        key: field,
        value: oThis.postFields[field]
      });
    }

    return responseHelper.successWithData({
      post_url: oThis.postUrl,
      post_fields: postFieldsArray,
      s3_url: oThis.s3Url,
      cdn_url: oThis.cdnUrl
    });
  }
}

module.exports = UploadParamsSingleFormatter;
