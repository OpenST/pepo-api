const rootPrefix = '../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  AwsS3wrapper = require(rootPrefix + '/lib/aws/S3Wrapper'),
  util = require(rootPrefix + '/lib/util'),
  shortToLongUrl = require(rootPrefix + '/lib/shortToLongUrl'),
  s3Constants = require(rootPrefix + '/lib/globalConstant/s3'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  imageConstants = require(rootPrefix + '/lib/globalConstant/image');

/**
 * Class to upload current user params.
 *
 * @class UploadParams
 */
class UploadParams extends ServiceBase {
  /**
   * Constructor to upload current user params.
   *
   * @param {object} params
   *
   * @param {string} params.current_user.id
   * @param {array<string>} [params.images]
   * @param {array<string>} [params.videos]
   * @param {array<string>} [params.channel_images]
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.currentUserId = +params.current_user.id;
    oThis.userImages = params.images || [];
    oThis.videos = params.videos || [];
    oThis.channelImages = params.channel_images || [];

    oThis.workingMap = {};
    oThis.apiResponse = {};
  }

  /**
   * Async perform.
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
    const oThis = this;

    if (oThis.userImages.length === 0 && oThis.videos.length === 0 && oThis.channelImages.length === 0) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_up_1',
          api_error_identifier: 'invalid_api_params',
          debug_options: {}
        })
      );
    }

    if (
      (oThis.userImages.length > 0 && oThis.channelImages.length !== 0) ||
      (oThis.channelImages.length > 0 && oThis.userImages.length !== 0)
    ) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_up_2',
          api_error_identifier: 'invalid_api_params',
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
      [s3Constants.videoFileType]: {
        [s3Constants.files]: oThis.videos,
        [s3Constants.resultKey]: s3Constants.videosResultKey
      }
    };

    if (oThis.userImages.length > 0) {
      oThis.workingMap[s3Constants.imageFileType] = {
        [s3Constants.files]: oThis.userImages,
        imageKind: 'normalImage',
        [s3Constants.resultKey]: s3Constants.imagesResultKey
      };
    } else if (oThis.channelImages.length > 0) {
      oThis.workingMap[s3Constants.imageFileType] = {
        [s3Constants.files]: oThis.channelImages,
        imageKind: imageConstants.channelImageKind,
        [s3Constants.resultKey]: s3Constants.channelImagesResultKey
      };
    }
  }

  /**
   * Process map.
   *
   * @sets oThis.apiResponse
   *
   * @returns {Promise<void>}
   * @private
   */
  async _processWorkingMap() {
    const oThis = this;

    for (const intent in oThis.workingMap) {
      const resultHash = {},
        intentHash = oThis.workingMap[intent],
        fileArray = intentHash[s3Constants.files],
        resultKey = intentHash[s3Constants.resultKey],
        imageKind = intentHash.imageKind || '';

      for (let index = 0; index < fileArray.length; index++) {
        const feFileName = fileArray[index],
          fileExtension = util.getFileExtension(feFileName),
          contentType = oThis._getContent(intent, fileExtension);

        if (!contentType) {
          return Promise.reject(
            responseHelper.paramValidationError({
              internal_error_identifier: 'a_s_up_3',
              api_error_identifier: 'invalid_api_params',
              params_error_identifiers: ['invalid_images'],
              debug_options: {}
            })
          );
        }

        let fileName = '';
        let preSignedPostParams = {};
        let s3Url = '';

        if (imageKind === imageConstants.channelImageKind) {
          fileName = oThis._getRandomEncodedFileNames(fileExtension);
          preSignedPostParams = await AwsS3wrapper.createPresignedPostFor(
            intent,
            fileName,
            contentType,
            coreConstants.AWS_REGION,
            { imageKind: imageKind }
          );
          s3Url = s3Constants.getS3Url(intent, fileName, true);
        } else {
          fileName = oThis._getRandomEncodedFileNames(fileExtension, oThis.currentUserId);
          preSignedPostParams = await AwsS3wrapper.createPresignedPostFor(
            intent,
            fileName,
            contentType,
            coreConstants.AWS_REGION
          );
          s3Url = s3Constants.getS3Url(intent, fileName, false);
        }

        const cdnUrl = oThis._getCdnUrl(s3Url);

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
   * Get CDN url.
   *
   * @param {string} s3Url
   *
   * @returns {string}
   * @private
   */
  _getCdnUrl(s3Url) {
    const splittedUrlArray = s3Url.split('/'),
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
   * @param {number} [userId]
   *
   * @returns {string}
   * @private
   */
  _getRandomEncodedFileNames(extension, userId = 0) {
    const fileName = util.getS3FileName('original', userId);

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
