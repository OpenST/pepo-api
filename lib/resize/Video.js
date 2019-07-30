const rootPrefix = '../..',
  ResizeBase = require(rootPrefix + '/lib/resize/Base'),
  VideoModel = require(rootPrefix + '/app/models/mysql/Video'),
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  util = require(rootPrefix + '/lib/util'),
  videoLib = require(rootPrefix + '/lib/videoLib'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  shortToLongUrl = require(rootPrefix + '/lib/shortToLongUrl'),
  s3Constants = require(rootPrefix + '/lib/globalConstant/s3'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  videoConstants = require(rootPrefix + '/lib/globalConstant/video'),
  mediaResizer = require(rootPrefix + '/lib/providers/mediaResizer'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs');

/**
 * Class to resize video.
 *
 * @class ResizeVideo
 */
class ResizeVideo extends ResizeBase {
  /**
   * Constructor to resize video.
   *
   * @param {object} params
   * @param {number} params.userId
   * @param {number} params.videoId
   *
   * @augments ResizeBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.videoId = params.videoId;

    oThis.compressData = {};
    oThis.video = {};
  }

  /**
   * Async performer.
   *
   * @returns {Promise<*>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._getVideoData();

    await oThis._prepareCompressRequestData();

    logger.log('------oThis.compressData----------', oThis.compressData);

    return oThis._compressVideos();
  }

  /**
   * Get video information.
   *
   * @sets oThis.video
   *
   * @returns {Promise<*>}
   * @private
   */
  async _getVideoData() {
    const oThis = this;

    oThis.video = await new VideoModel().fetchById(oThis.videoId);

    if (!oThis.video || oThis.video.status === videoConstants.compressionStartedStatus) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_r_v_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { videoId: oThis.videoId }
        })
      );
    }

    await new VideoModel()
      .update({ status: videoConstants.invertedStatuses[videoConstants.compressionStartedStatus] })
      .where({ id: oThis.videoId })
      .fire();

    await VideoModel.flushCache({ id: oThis.videoId });

    return responseHelper.successWithData({});
  }

  /**
   * Prepare compress request data.
   *
   * @sets oThis.compressData
   *
   * @private
   */
  async _prepareCompressRequestData() {
    const oThis = this;

    const sourceUrl = await oThis.getSourceUrl(oThis.video.resolutions),
      bucket = s3Constants.bucket(s3Constants.videoFileType);

    oThis.compressData = {
      source_url: sourceUrl,
      upload_details: {
        bucket: bucket,
        acl: oThis.getAcl(),
        region: oThis.getRegion()
      },
      compression_data: {}
    };

    const videoKind = videoConstants.userVideoKind;
    const sizesToGenerate = videoConstants.compressionSizes[videoKind];

    for (const sizeName in sizesToGenerate) {
      const sizeDetails = sizesToGenerate[sizeName];
      oThis._setCompressDetails(sizeName, sizeDetails);
    }
  }

  /**
   * Compress videos and update table entry.
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _compressVideos() {
    const oThis = this;

    if (basicHelper.isEmptyObject(oThis.compressData.compression_data)) {
      return responseHelper.successWithData({});
    }

    const promisesArray = [],
      resolutionsHash = {},
      compressionFailed = {};

    const requestData = {
      source_url: oThis.compressData.source_url,
      upload_details: oThis.compressData.upload_details
    };

    for (const compressionSize in oThis.compressData.compression_data) {
      requestData.compression_data = {};
      requestData.compression_data[compressionSize] = oThis.compressData.compression_data[compressionSize];
      logger.log('\n=====requestData======', requestData);
      const compressionPromise = mediaResizer
        .compressVideo(requestData)
        .then(function(response) {
          if (response.isSuccess() && response.data.compressedData) {
            logger.log('======success====response=======', response);
            resolutionsHash[compressionSize] = response.data.compressedData[compressionSize];
          } else {
            logger.error('======failed====response=======', response);
            compressionFailed[compressionSize] = 1;
          }
        })
        .catch(function(err) {
          compressionFailed[compressionSize] = 1;
          logger.error(`Error: ${err}`);
        });
      promisesArray.push(compressionPromise);
    }

    await Promise.all(promisesArray);

    if (CommonValidator.validateNonEmptyObject(resolutionsHash)) {
      Object.assign(resolutionsHash, { original: oThis.currentResolutions.original });

      for (const resolution in resolutionsHash) {
        const params = { isExternalUrl: false, imageUrl: resolutionsHash[resolution].url };

        const shortenedUrl = videoLib.shortenUrl(params);
        if (shortenedUrl.isFailure()) {
          return Promise.reject(shortenedUrl);
        }
        resolutionsHash[resolution].url = shortenedUrl.data.shortUrl;
      }

      Object.assign(oThis.currentResolutions, resolutionsHash);
    }

    // Decide final status.
    const status = CommonValidator.validateNonEmptyObject(compressionFailed)
      ? videoConstants.compressionFailedStatus
      : videoConstants.compressionDoneStatus;

    // Update in video table.
    await new VideoModel()
      .update({
        status: videoConstants.invertedStatuses[status],
        resolutions: JSON.stringify(oThis.currentResolutions)
      })
      .where({ id: oThis.videoId })
      .fire();

    // Clear cache.
    await VideoModel.flushCache({ id: oThis.videoId });
    logger.log('---2------------oThis.currentResolutions----------', oThis.currentResolutions);

    if (status === videoConstants.compressionFailedStatus) {
      const errObject = responseHelper.error({
        internal_error_identifier: 'l_rv_2',
        api_error_identifier: 'something_went_wrong',
        debug_options: { compressionFailed: compressionFailed }
      });

      await createErrorLogsEntry.perform(errObject, errorLogsConstants.mediumSeverity);
    }

    return responseHelper.successWithData({});
  }

  /**
   * Set resize details.
   *
   * @param {string} sizeName
   * @param {object} sizeDetails
   *
   * @returns {{}}
   * @private
   */
  _setCompressDetails(sizeName, sizeDetails) {
    const oThis = this;

    const extension = util.getFileExtension(oThis.compressData.source_url),
      compressDetails = {};

    // Don't send to resize if already present in current resolution.
    if (oThis.currentResolutions[sizeName] && oThis.currentResolutions[sizeName].width) {
      return {};
    }

    if (sizeDetails.width) {
      // Don't send to resize if asking width is grater than original width.
      if (oThis.originalResolution.width && oThis.originalResolution.width < sizeDetails.width) {
        return {};
      }
      compressDetails.width = sizeDetails.width;
    }
    if (sizeDetails.height) {
      // Don't send to resize if asking height is grater than original height.
      if (oThis.originalResolution.height && oThis.originalResolution.height < sizeDetails.height) {
        return {};
      }
      compressDetails.height = sizeDetails.height;
    }
    compressDetails.content_type = util.getVideoContentTypeForExtension(extension);

    const fileName = util.getS3FileName(oThis.userId, sizeName),
      completeFileName = fileName + extension;

    compressDetails.file_path = coreConstants.S3_USER_VIDEOS_FOLDER + '/' + completeFileName;
    compressDetails.s3_url = s3Constants.getS3Url(s3Constants.videoFileType, completeFileName);

    oThis.compressData.compression_data[sizeName] = compressDetails;

    return {};
  }

  /**
   * Mark video compression failed.
   *
   * @returns {Promise<*>}
   */
  async markMediaResizeFailed() {
    const oThis = this;

    return new VideoModel()
      .update({ status: videoConstants.invertedStatuses[videoConstants.compressionFailedStatus] })
      .where({ id: oThis.videoId })
      .fire();
  }
}

module.exports = ResizeVideo;
