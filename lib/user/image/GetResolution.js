const rootPrefix = '../../..',
  s3Constants = require(rootPrefix + '/lib/globalConstant/s3'),
  imageConstants = require(rootPrefix + '/lib/globalConstant/image'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class GetImageResolutions {
  /**
   * @constructor
   *
   * @param params
   * @param {object} params.resolutions - text to insert
   * @param {object} params.kind - kind of the image
   * @param {boolean} params.isExternalUrl - is external url
   */
  constructor(params) {
    const oThis = this;

    // validate image kind
    oThis.resolutions = params.resolutions;
    oThis.kind = params.kind;
    oThis.isExternalUrl = params.isExternalUrl;

    oThis.sanitizedResolution = {};

    oThis.hasBeenValidated = false;
  }

  /**
   * Perform
   *
   * @return {Promise<void>}
   */
  perform() {
    const oThis = this;
    oThis.validate();
    return oThis._getResolution();
  }

  /**
   * validate
   *
   * returns {object}
   */
  validate() {
    const oThis = this;

    if (oThis.hasBeenValidated) {
      return responseHelper.successWithData({});
    }

    if (imageConstants.allowedImageKinds[oThis.kind] !== 1) {
      return responseHelper.paramValidationError({
        internal_error_identifier: 'l_u_i_v_1',
        api_error_identifier: 'invalid_api_params',
        params_error_identifiers: 'invalid_kind',
        debug_options: { kind: oThis.kind }
      });
    }

    oThis.sanitizedResolution = {};

    //check if already validated

    if (typeof oThis.resolutions === 'object') {
      for (let key in oThis.resolutions) {
        let resolution = oThis.resolutions[key];

        //create a new resolution
        let size = resolution.size;
        let width = resolution.width;
        let height = resolution.height;
        if (
          !CommonValidators.validateInteger(size) ||
          !CommonValidators.validateInteger(width) ||
          !CommonValidators.validateInteger(height)
        ) {
          // return error
          return responseHelper.paramValidationError({
            internal_error_identifier: 'l_u_i_v_2',
            api_error_identifier: 'invalid_api_params',
            params_error_identifiers: 'invalid_resolution',
            debug_options: { resolutions: oThis.resolutions }
          });
        }

        let validateUrlRsp = oThis._validateAndSanitizeUrl(resolution.url);
        if (validateUrlRsp.isFailure()) return validateUrlRsp;
        let url = validateUrlRsp.data.url;

        oThis.sanitizedResolution[key] = {
          size: size,
          width: width,
          height: height,
          url: url
        };
      }
    } else {
      //  error
      return responseHelper.paramValidationError({
        internal_error_identifier: 'l_u_i_v_3',
        api_error_identifier: 'invalid_api_params',
        params_error_identifiers: 'invalid_resolution',
        debug_options: { resolutions: oThis.resolutions }
      });
    }

    oThis.hasBeenValidated = true;
    return responseHelper.successWithData({});
  }

  /**
   * validate url
   *
   * return {object}
   */
  _validateAndSanitizeUrl(url) {
    const oThis = this;
    let isValidUrl = true;

    if (oThis.isExternalUrl) {
      return responseHelper.successWithData({ url: url });
    }
    if (!CommonValidators.isVarNullOrUndefined(url)) {
      let splittedUrlArray = url.split('/');
      let fileName = splittedUrlArray.pop();
      let baseUrl = splittedUrlArray.join('/');
      let shortEntity = s3Constants.LongUrlToShortUrlMap[baseUrl];
      url = '{{' + shortEntity + '}}/' + fileName;
      if (
        CommonValidators.isVarNullOrUndefined(fileName) ||
        CommonValidators.isVarNullOrUndefined(s3Constants.LongUrlToShortUrlMap[baseUrl])
      ) {
        isValidUrl = false;
      }
    } else {
      isValidUrl = false;
    }

    if (!isValidUrl) {
      return responseHelper.paramValidationError({
        internal_error_identifier: 'l_u_i_vasu_1',
        api_error_identifier: 'invalid_api_params',
        params_error_identifiers: 'invalid_url',
        debug_options: { resolutions: oThis.resolutions }
      });
    }
    return responseHelper.successWithData({ url: url });
  }

  /**
   * get resolution
   *
   * returns {object}
   */
  _getResolution() {
    const oThis = this;
    return responseHelper.successWithData(oThis.sanitizedResolution);
  }
}

module.exports = GetImageResolutions;
