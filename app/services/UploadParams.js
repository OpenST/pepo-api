const rootPrefix = '../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  AwsS3wrapper = require(rootPrefix + '/lib/aws/S3Wrapper'),
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  util = require(rootPrefix + '/lib/util'),
  shortToLongUrl = require(rootPrefix + '/lib/shortToLongUrl'),
  s3Constants = require(rootPrefix + '/lib/globalConstant/s3'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class UploadParams extends ServiceBase {
  /**
   * @constructor
   *
   * @param params
   *
   * @param {string} params.current_user.id
   *
   * @param {string} [params.images]
   * @param {string} [params.videos]
   *
   */
  constructor(params) {
    super(params);
    const oThis = this;

    oThis.currentUserId = +params.current_user.id;
    oThis.images = params.images || [];
    oThis.videos = params.videos || [];

    oThis.apiResponse = {};
  }

  /**
   * Async performer.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateAndSanitizeParams();

    await oThis._setWorkingVars();

    await oThis._processWorkingMap();

    return responseHelper.successWithData({ uploadParamsMap: oThis.apiResponse });
  }

  /**
   * Validate and sanitize params.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this,
      paramErrors = [];

    // Validate user id;

    if (oThis.images) {
      for (let index = 0; index < oThis.images.length; index++) {
        if (!CommonValidator.validateString(oThis.images[index])) {
          paramErrors.push('invalid_images');
        }
      }
    }

    if (oThis.videos) {
      for (let index = 0; index < oThis.videos.length; index++) {
        if (!CommonValidator.validateString(oThis.videos[index])) {
          paramErrors.push('invalid_videos');
        }
      }
    }

    if (oThis.images.length === 0 && oThis.videos.length === 0) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_up_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: paramErrors,
          debug_options: {}
        })
      );
    }

    if (paramErrors.length > 0) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_up_2',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: paramErrors,
          debug_options: {}
        })
      );
    }
  }

  /**
   * Sets working map.
   *
   * @sets oThis.workingMap
   *
   * @returns {Promise<void>}
   * @private
   */
  async _setWorkingVars() {
    const oThis = this;

    oThis.workingMap = {
      [s3Constants.imageFileType]: {
        [s3Constants.files]: oThis.images,
        [s3Constants.fileType]: s3Constants.imageFileType,
        [s3Constants.resultKey]: s3Constants.imagesResultKey
      },
      [s3Constants.videoFileType]: {
        [s3Constants.files]: oThis.videos,
        [s3Constants.fileType]: s3Constants.videoFileType,
        [s3Constants.resultKey]: s3Constants.videosResultKey
      }
    };
  }

  /**
   * Process map.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _processWorkingMap() {
    const oThis = this;

    for (let intent in oThis.workingMap) {
      let resultHash = {},
        intentHash = oThis.workingMap[intent],
        fileArray = intentHash[s3Constants.files],
        resultKey = intentHash[s3Constants.resultKey];

      for (let index = 0; index < fileArray.length; index++) {
        const feFileName = fileArray[index],
          fileExtension = util.getFileExtension(feFileName),
          contentType = oThis._getContent(intent, fileExtension),
          fileName = oThis._getRandomEncodedFileNames(fileExtension);

        const preSignedPostParams = await AwsS3wrapper.createPresignedPostFor(
          intent,
          fileName,
          contentType,
          coreConstants.AWS_REGION
        );

        const s3Url = s3Constants.getS3Url(intent, fileName),
          cdnUrl = oThis._getCdnUrl(s3Url);

        logger.log('==== cdnUrl', cdnUrl);

        resultHash[feFileName] = {
          postUrl: preSignedPostParams.url,
          postFields: preSignedPostParams.fields,
          s3Url: s3Url,
          cdnUrl: cdnUrl
        };
      }

      oThis.apiResponse[resultKey] = resultHash;
    }
  }

  /**
   * Get cdn url.
   *
   * @param {string} s3Url
   * @private
   */
  _getCdnUrl(s3Url) {
    let splittedUrlArray = s3Url.split('/'),
      fileName = splittedUrlArray.pop(),
      baseUrl = splittedUrlArray.join('/'),
      shortEntity = s3Constants.LongUrlToShortUrlMap[baseUrl];

    const shortUrl = shortEntity + '/' + fileName;

    logger.log('==== shortUrl', shortUrl);

    return shortToLongUrl.getFullUrl(shortUrl);
  }

  /**
   * Get random encoded file names.
   *
   * @param {string} extension
   *
   * @returns {string}
   * @private
   */
  _getRandomEncodedFileNames(extension) {
    const oThis = this,
      fileName = util.getS3FileName(oThis.currentUserId, 'original');

    return fileName + extension;
  }

  /**
   * Get content type.
   *
   * @param {string} intent
   * @param {string} fileExtension
   *
   * @returns {string}
   * @private
   */
  _getContent(intent, fileExtension) {
    switch (intent) {
      case s3Constants.imageFileType:
        return util.getImageContentTypeForExtension(fileExtension);

      case s3Constants.videoFileType:
        return util.getVideoContentTypeForExtension(fileExtension);

      default:
        throw new Error('Unsupported file type.');
    }
  }
}

module.exports = UploadParams;
