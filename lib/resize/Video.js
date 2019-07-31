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
   * @param {boolean} [params.resizeAll]
   *
   * @augments ResizeBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.videoId = params.videoId;
    oThis.resizeAll = params.resizeAll || false;

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

    if (!oThis.video.urlTemplate) {
      const fileExtension = util.getFileExtension(oThis.video.resolutions.original.url);
      oThis.video.urlTemplate =
        s3Constants.videoShortUrlPrefix +
        '/' +
        util.getS3FileTemplatePrefix(oThis.userId) +
        s3Constants.fileNameShortSizeSuffix +
        fileExtension;
    }

    return responseHelper.successWithData({});
  }

  /**
   * Prepare compress request data.
   *
   * @sets oThis.compressData
   *
   * @private
   * @returns {Promise<*>}
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

    // If resize all flag is set, then following check is not performed.
    if (!oThis.resizeAll) {
      // Don't send to resize if already present in current resolution.
      if (oThis.currentResolutions[sizeName] && oThis.currentResolutions[sizeName].width) {
        return {};
      }
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

    const completeFileName = shortToLongUrl.getCompleteFileName(oThis.video.urlTemplate, sizeName);

    compressDetails.file_path = coreConstants.S3_USER_VIDEOS_FOLDER + '/' + completeFileName;
    compressDetails.s3_url = shortToLongUrl.getFullUrlInternal(oThis.video.urlTemplate, sizeName);

    oThis.compressData.compression_data[sizeName] = compressDetails;

    return {};
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
      await new VideoModel()
        .update({ status: videoConstants.invertedStatuses[videoConstants.compressionDoneStatus] })
        .where({ id: oThis.videoId })
        .fire();

      await VideoModel.flushCache({ id: oThis.videoId });

      return responseHelper.successWithData({});
    }

    const resolutionsHash = {},
      compressionFailed = {};

    const requestData = {
      source_url: oThis.compressData.source_url,
      upload_details: oThis.compressData.upload_details
    };

    for (const compressionSize in oThis.compressData.compression_data) {
      requestData.compression_data = {};
      requestData.compression_data[compressionSize] = oThis.compressData.compression_data[compressionSize];

      const compressionPromise = mediaResizer
        .compressVideo(requestData)
        .then(function(response) {
          if (response.isSuccess() && response.data.compressedData[compressionSize]) {
            resolutionsHash[compressionSize] = response.data.compressedData[compressionSize];
          } else {
            compressionFailed[compressionSize] = response.error || response.data.compressionErrors;
          }
        })
        .catch(function(err) {
          compressionFailed[compressionSize] = err;
          logger.error(`Error: ${err}`);
        });

      await compressionPromise;
    }

    if (CommonValidator.validateNonEmptyObject(resolutionsHash)) {
      Object.assign(resolutionsHash, { original: oThis.currentResolutions.original });

      for (const resolution in resolutionsHash) {
        const params = { isExternalUrl: false, videoUrl: resolutionsHash[resolution].url };

        const shortenedUrl = videoLib.shortenUrl(params);
        if (shortenedUrl.isFailure()) {
          return Promise.reject(responseHelper.error(shortenedUrl));
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
    await new VideoModel().updateVideo({
      id: oThis.videoId,
      urlTemplate: oThis.video.urlTemplate,
      resolutions: oThis.currentResolutions,
      status: status
    });

    const promisesArray = [];
    // Clear cache.
    promisesArray.push(VideoModel.flushCache({ id: oThis.videoId }));

    if (status === videoConstants.compressionFailedStatus) {
      const errObject = responseHelper.error({
        internal_error_identifier: 'l_r_v_2',
        api_error_identifier: 'something_went_wrong',
        debug_options: { compressionFailed: compressionFailed }
      });

      promisesArray.push(createErrorLogsEntry.perform(errObject, errorLogsConstants.mediumSeverity));
    }

    await Promise.all(promisesArray);

    return responseHelper.successWithData({});
  }

  /**
   * Mark video compression failed.
   *
   * @returns {Promise<*>}
   */
  async markMediaResizeFailed() {
    const oThis = this;

    await new VideoModel()
      .update({ status: videoConstants.invertedStatuses[videoConstants.compressionFailedStatus] })
      .where({ id: oThis.videoId })
      .fire();

    return VideoModel.flushCache({ id: oThis.videoId });
  }
}

module.exports = ResizeVideo;
