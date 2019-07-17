/**
 * This is library for saving and validating video urls
 * @module lib/videoLib.js
 */
const rootPrefix = '..',
  VideoModel = require(rootPrefix + '/app/models/mysql/Video'),
  videoConstants = require(rootPrefix + '/lib/globalConstant/video'),
  s3Constants = require(rootPrefix + '/lib/globalConstant/s3'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  imageLib = require(rootPrefix + '/lib/imageLib'),
  imageConstants = require(rootPrefix + '/lib/globalConstant/image'),
  VideoDetailModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class to perform validating and video urls
 *
 * @class
 */
class VideoLib {
  /**
   * Method to validate video object
   *
   * @param params
   */
  validateVideoObj(params) {
    const oThis = this;

    if (
      !CommonValidators.validateInteger(params.size || 0) ||
      !CommonValidators.validateInteger(params.width || 0) ||
      !CommonValidators.validateInteger(params.height || 0)
    ) {
      // return error
      return responseHelper.paramValidationError({
        internal_error_identifier: 'lib_vl_1',
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

    return responseHelper.successWithData({ video: response });
  }

  /**
   * Method to validate video and save it.
   *
   * @param params
   * @returns {Promise<void>}
   */
  async validateAndSave(params) {
    const oThis = this;

    let resp = oThis.validateVideoObj(params);
    if (resp.isFailure()) {
      return resp;
    }

    let videoObject = resp.data.video,
      coverImageId = null;

    if (CommonValidators.validateString(params.posterImageUrl)) {
      let imageSaveResp = await imageLib.validateAndSave({
        imageUrl: params.posterImageUrl,
        size: params.posterImageSize,
        width: params.posterImageWidth,
        height: params.posterImageHeight,
        kind: imageConstants.posterImageKind,
        isExternalUrl: params.isExternalUrl
      });
      if (imageSaveResp.isFailure()) {
        return imageSaveResp;
      }

      coverImageId = Object.keys(imageSaveResp.data)[0];
    }

    let insertParams = {
      resolutions: videoObject,
      posterImageId: coverImageId,
      status: videoConstants.activeStatus
    };

    let videoRow = await new VideoModel().insertVideo(insertParams),
      response = {};

    await new VideoDetailModel().insertVideo({
      userId: params.userId,
      videoId: videoRow.insertId
    });

    videoObject.posterImageId = coverImageId;
    response[videoRow.insertId] = videoObject;
    return responseHelper.successWithData(response);
  }

  /**
   * Shorten url from the full length url
   *
   * @param params
   */
  shortenUrl(params) {
    const oThis = this;

    let shortUrl = params.videoUrl;
    // If false, means url needs to be validate as per our internal url requirement
    if (!params.isExternalUrl) {
      let splittedUrlArray = params.videoUrl.split('/'),
        fileName = splittedUrlArray.pop(),
        baseUrl = splittedUrlArray.join('/'),
        shortEntity = s3Constants.LongUrlToShortUrlMap[baseUrl];

      shortUrl = shortEntity + '/' + fileName;
      if (
        CommonValidators.isVarNullOrUndefined(fileName) ||
        CommonValidators.isVarNullOrUndefined(s3Constants.LongUrlToShortUrlMap[baseUrl])
      ) {
        return responseHelper.error({
          internal_error_identifier: 'lib_vl_2',
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

module.exports = new VideoLib();
