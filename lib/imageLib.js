/**
 * This is library for saving and validating image urls
 * @module lib/ImageLib.js
 */
const rootPrefix = '..',
  ImageModel = require(rootPrefix + '/app/models/mysql/Image'),
  imageConstants = require(rootPrefix + '/lib/globalConstant/image'),
  s3Constants = require(rootPrefix + '/lib/globalConstant/s3'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class to perform validating and image urls
 *
 * @class
 */
class ImageLib {
  /**
   * Method to validate image object
   *
   * @param params
   */
  validateImageObj(params) {
    const oThis = this;

    if (
      !CommonValidators.validateInteger(params.size || 0) ||
      !CommonValidators.validateInteger(params.width || 0) ||
      !CommonValidators.validateInteger(params.height || 0)
    ) {
      // return error
      return responseHelper.paramValidationError({
        internal_error_identifier: 'lib_il_1',
        api_error_identifier: 'invalid_api_params',
        params_error_identifiers: 'invalid_resolution',
        debug_options: { params: params }
      });
    }

    let resp = oThis.shortenUrl(params);
    if (resp.isFailure()) {
      return resp;
    }

    let response = {
      original: {
        url: resp.data.shortUrl,
        size: params.size,
        height: params.height,
        width: params.width
      }
    };

    return responseHelper.successWithData({ image: response });
  }

  /**
   * Method to validate image and save it.
   *
   * @param params
   * @returns {Promise<void>}
   */
  async validateAndSave(params) {
    const oThis = this;

    let resp = oThis.validateImageObj(params);
    if (resp.isFailure()) {
      return resp;
    }

    let imageObject = resp.data.image;

    let insertParams = {
      userId: oThis.userId,
      resolutions: imageObject,
      kind: params.kind,
      status: imageConstants.notResized
    };

    let imageRow = await new ImageModel().insertImage(insertParams),
      response = {};

    response[imageRow.insertId] = imageObject;
    return responseHelper.successWithData(response);
  }

  /**
   * Shorten url from the full length url
   *
   * @param params
   */
  shortenUrl(params) {
    const oThis = this;

    let shortUrl = params.image_url;
    // If false, means url needs to be validate as per our internal url requirement
    if (!params.isExternalUrl) {
      let splittedUrlArray = params.image_url.split('/'),
        fileName = splittedUrlArray.pop(),
        baseUrl = splittedUrlArray.join('/'),
        shortEntity = s3Constants.LongUrlToShortUrlMap[baseUrl];

      shortUrl = shortEntity + '/' + fileName;
      if (
        CommonValidators.isVarNullOrUndefined(fileName) ||
        CommonValidators.isVarNullOrUndefined(s3Constants.LongUrlToShortUrlMap[baseUrl])
      ) {
        return responseHelper.error({
          internal_error_identifier: 'lib_il_2',
          api_error_identifier: 'invalid_url',
          debug_options: {}
        });
      }
    }

    return responseHelper.successWithData({ shortUrl: shortUrl });
  }

  /**
   * Get full length url from the shorten ones
   *
   * @param params
   */
  getFullUrl(params) {}
}

module.exports = new ImageLib();
