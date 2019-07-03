const rootPrefix = '../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  AwsS3wrapper = require(rootPrefix + '/lib/aws/S3Wrapper'),
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  util = require(rootPrefix + '/lib/util'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  s3UploadConstants = require(rootPrefix + '/lib/globalConstant/s3Upload');

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

    if (paramErrors.length > 0) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_up_1',
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
      [s3UploadConstants.imageFileType]: {
        [s3UploadConstants.files]: oThis.images,
        [s3UploadConstants.fileType]: s3UploadConstants.imageFileType,
        [s3UploadConstants.resultKey]: s3UploadConstants.imagesResultKey
      },
      [s3UploadConstants.videoFileType]: {
        [s3UploadConstants.files]: oThis.videos,
        [s3UploadConstants.fileType]: s3UploadConstants.videoFileType,
        [s3UploadConstants.resultKey]: s3UploadConstants.videosResultKey
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
        fileType = intentHash[s3UploadConstants.fileType],
        fileArray = intentHash[s3UploadConstants.files],
        resultKey = intentHash[s3UploadConstants.resultKey];

      for (let index = 0; index < fileArray.length; index++) {
        const feFileName = fileArray[index],
          fileExtension = util.getFileExtension(feFileName),
          contentType = oThis._getContent(intent, fileExtension),
          fileNames = oThis._getRandomEncodedFileNames(fileType, fileExtension, index),
          fileName = fileNames.name;

        const preSignedPostParams = new AwsS3wrapper(intent, fileName, contentType).createPresignedPostFor();

        resultHash[feFileName] = {
          postUrl: preSignedPostParams.url,
          postFields: preSignedPostParams.fields,
          s3Url: oThis._getS3Url(preSignedPostParams)
        };
      }

      oThis.apiResponse[resultKey] = resultHash;
    }
  }

  /**
   * Get random encoded file names.
   *
   * @param {string} fileType
   * @param {string} extension
   * @param {number} fileIndex
   *
   * @returns {{name: (string|*), resizeName: (string|*), original: (string|*)}}
   * @private
   */
  _getRandomEncodedFileNames(fileType, extension, fileIndex) {
    const oThis = this,
      version = oThis.currentUserId + '-' + util.createMd5Digest(oThis._getVersion(fileIndex));

    let name = null;

    switch (fileType) {
      case s3UploadConstants.imageFileType:
        name = version + '-original' + extension;
        break;
      case s3UploadConstants.videoFileType:
        name = version + '-original' + extension;
        break;
      default:
        throw new Error('Unsupported file type.');
    }

    return {
      name: name,
      resizeName: name,
      original: name
    };
  }

  /**
   * Get version.
   *
   * @param {number} fileIndex
   *
   * @returns {string}
   * @private
   */
  _getVersion(fileIndex) {
    const oThis = this;

    return (
      oThis.currentUserId + '-' + new Date().getTime() + '-' + Math.floor(Math.random() * 100000000) + '-' + fileIndex
    );
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
      case s3UploadConstants.imageFileType:
        return util.getImageContentTypeForExtension(fileExtension);

      case s3UploadConstants.videoFileType:
        return util.getVideoContentTypeForExtension(fileExtension);

      default:
        throw new Error('Unsupported file type.');
    }
  }

  /**
   * Get s3 url.
   *
   * @param {hash} preSignedPostParams
   *
   * @private
   */
  _getS3Url(preSignedPostParams) {
    return 'https://' + preSignedPostParams.fields.bucket + '.s3.amazonaws.com/' + preSignedPostParams.fields.key;
  }
}

module.exports = UploadParams;
