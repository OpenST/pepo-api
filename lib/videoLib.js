/**
 * This is library for saving and validating video urls.
 *
 * @module lib/videoLib
 */
const rootPrefix = '..',
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  VideoModel = require(rootPrefix + '/app/models/mysql/Video'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  VideoDetailModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  imageLib = require(rootPrefix + '/lib/imageLib'),
  s3Constants = require(rootPrefix + '/lib/globalConstant/s3'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob'),
  videoConstants = require(rootPrefix + '/lib/globalConstant/video'),
  imageConstants = require(rootPrefix + '/lib/globalConstant/image');

/**
 * Class to validate and shorten video urls.
 *
 * @class VideoLib
 */
class VideoLib {
  /**
   * Method to validate video object
   *
   * @param {object} params
   * @param {number} [params.size]
   * @param {number} [params.width]
   * @param {number} [params.height]
   * @param {string} params.videoUrl
   * @param {boolean} params.isExternalUrl
   *
   * @returns {Result}
   */
  validateVideoObj(params) {
    const oThis = this;

    if (
      !CommonValidators.validateInteger(params.size || 0) ||
      !CommonValidators.validateInteger(params.width || 0) ||
      !CommonValidators.validateInteger(params.height || 0)
    ) {
      // Return error.
      return responseHelper.paramValidationError({
        internal_error_identifier: 'lib_vl_1',
        api_error_identifier: 'invalid_api_params',
        params_error_identifiers: 'invalid_resolution',
        debug_options: { params: params }
      });
    }

    const resp = oThis.shortenUrl(params);
    if (resp.isFailure()) {
      return resp;
    }

    const response = {
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
   * @param {object} params
   * @param {string} params.userId
   * @param {string} params.posterImageUrl
   * @param {number} params.posterImageSize
   * @param {number} params.posterImageWidth
   * @param {number} params.posterImageHeight
   * @param {boolean} params.isExternalUrl
   * @param {number} params.userId
   * @param {number} [params.size]
   * @param {number} [params.width]
   * @param {number} [params.height]
   * @param {string} params.videoUrl
   *
   * @returns {Promise<Result>}
   */
  async validateAndSave(params) {
    const oThis = this;

    const resp = oThis.validateVideoObj(params);
    if (resp.isFailure()) {
      return resp;
    }

    const videoObject = resp.data.video;
    let coverImageId = null;

    if (CommonValidators.validateString(params.posterImageUrl)) {
      const imageSaveResp = await imageLib.validateAndSave({
        imageUrl: params.posterImageUrl,
        size: params.posterImageSize,
        width: params.posterImageWidth,
        height: params.posterImageHeight,
        kind: imageConstants.posterImageKind,
        isExternalUrl: params.isExternalUrl,
        userId: params.userId,
        enqueueResizer: true
      });
      if (imageSaveResp.isFailure()) {
        return imageSaveResp;
      }

      coverImageId = imageSaveResp.data.insertId;
    }

    const insertParams = {
      userId: params.userId,
      resolutions: videoObject,
      posterImageId: coverImageId,
      status: videoConstants.notCompressedStatus
    };

    const videoRow = await new VideoModel().insertVideo(insertParams);

    const promisesArray = [];

    // Update video detail model.
    promisesArray.push(
      new VideoDetailModel().insertVideo({
        userId: params.userId,
        videoId: videoRow.insertId
      })
    );

    // Enqueue video resizer.
    promisesArray.push(
      bgJob.enqueue(bgJobConstants.videoResizer, { userId: params.userId, videoId: videoRow.insertId })
    );

    await Promise.all(promisesArray);

    videoObject.posterImageId = coverImageId;

    return responseHelper.successWithData({ video: videoObject, insertId: videoRow.insertId });
  }

  /**
   * Shorten url from the full length url.
   *
   * @param {object} params
   * @param {string} params.videoUrl
   * @param {boolean} params.isExternalUrl
   *
   * @returns {Result}
   */
  shortenUrl(params) {
    let shortUrl = params.videoUrl;
    // If false, means url needs to be validate as per our internal url requirement
    if (!params.isExternalUrl) {
      const splittedUrlArray = params.videoUrl.split('/'),
        fileName = splittedUrlArray.pop(),
        baseUrl = splittedUrlArray.join('/'),
        shortEntity = s3Constants.LongUrlToShortUrlMap[baseUrl];

      if (CommonValidators.isVarNullOrUndefined(fileName) || CommonValidators.isVarNullOrUndefined(shortEntity)) {
        return responseHelper.error({
          internal_error_identifier: 'lib_vl_2',
          api_error_identifier: 'invalid_url',
          debug_options: {}
        });
      }

      shortUrl = shortEntity + '/' + fileName;
    }

    return responseHelper.successWithData({ shortUrl: shortUrl });
  }
}

module.exports = new VideoLib();
