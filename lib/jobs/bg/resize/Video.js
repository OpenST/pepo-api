const rootPrefix = '../../../..',
  ResizeBase = require(rootPrefix + '/lib/resize/Base'),
  VideoModel = require(rootPrefix + '/app/models/mysql/Video'),
  util = require(rootPrefix + '/lib/util'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  s3Constants = require(rootPrefix + '/lib/globalConstant/s3'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  videoConstants = require(rootPrefix + '/lib/globalConstant/video'),
  mediaResizer = require(rootPrefix + '/lib/providers/mediaResizer'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob'),
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
   * Fetch entity.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchEntity() {
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

    oThis._prepareUrlTemplate();

    // Mark entity as resize started.
    await oThis._updateEntity(videoConstants.compressionStartedStatus);
  }

  /**
   * Update entity.
   *
   * @param {string} status
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateEntity(status) {
    const oThis = this;

    await new VideoModel().updateVideo({
      id: oThis.videoId,
      urlTemplate: oThis.video.urlTemplate,
      resolutions: oThis.video.resolutions,
      status: status
    });

    await VideoModel.flushCache({ id: oThis.videoId });

    if (status === videoConstants.compressionFailedStatus) {
      const errObject = responseHelper.error({
        internal_error_identifier: 'l_r_v_2',
        api_error_identifier: 'something_went_wrong',
        debug_options: ''
      });
      await createErrorLogsEntry.perform(errObject, errorLogsConstants.mediumSeverity);
    }
  }

  /**
   * Prepare request data for resizer.
   *
   * @sets oThis.compressData
   *
   * @private
   * @returns {Promise<*>}
   */
  async _prepareResizerRequestData() {
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
    const extension = util.getFileExtension(sourceUrl);
    const contentType = util.getVideoContentTypeForExtension(extension);

    for (const sizeName in sizesToGenerate) {
      const sizeDetails = sizesToGenerate[sizeName];
      const resizeData = oThis._setResizeDetails(
        sizeName,
        sizeDetails,
        contentType,
        oThis.video.urlTemplate,
        coreConstants.S3_USER_VIDEOS_FOLDER
      );

      if (!basicHelper.isEmptyObject(resizeData)) {
        oThis.compressData.compression_data[sizeName] = resizeData;
      }
    }
  }

  /**
   * Send request to resizer and mark in DB.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _sendResizerRequest() {
    const oThis = this;

    if (basicHelper.isEmptyObject(oThis.compressData.compression_data)) {
      await oThis._updateEntity(videoConstants.compressionDoneStatus);

      return responseHelper.successWithData({});
    }

    const resp = await mediaResizer.compressVideo(oThis.compressData);
    if (resp.isFailure()) {
      await oThis._updateEntity(videoConstants.compressionFailedStatus);
    }
    /* NOTE: Commented for now.
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
      await basicHelper.sleep(10000);
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

    oThis.video.resolutions = oThis.currentResolutions;
    await oThis._updateEntity(status);

    if (status === videoConstants.compressionFailedStatus) {
      const errObject = responseHelper.error({
        internal_error_identifier: 'l_r_v_2',
        api_error_identifier: 'something_went_wrong',
        debug_options: { compressionFailed: compressionFailed }
      });
      await createErrorLogsEntry.perform(errObject, errorLogsConstants.mediumSeverity);
    }
     */

    await bgJob.enqueue(
      bgJobConstants.checkResizeProgressJobTopic,
      { userId: oThis.userId, mediaId: oThis.videoId, mediaKind: s3Constants.videoFileType, trialCount: 1 },
      { publishAfter: 30000 }
    );

    return responseHelper.successWithData({});
  }

  /**
   * Mark image resize failed.
   *
   * @returns {Promise<*>}
   */
  async markMediaResizeFailed() {
    const oThis = this;

    await oThis._updateEntity(videoConstants.compressionFailedStatus);
  }

  /**
   * Prepares url template. If url is
   *
   * @private
   */
  _prepareUrlTemplate() {
    const oThis = this;

    if (!oThis.video.urlTemplate) {
      const videoUrl = oThis.video.resolutions.original.url,
        fileExtension = util.getFileExtension(videoUrl);
      const splitUrlArray = videoUrl.split('/'),
        fileName = splitUrlArray.pop(),
        structuredFileName = fileName.split('-');

      oThis.video.urlTemplate =
        s3Constants.videoShortUrlPrefix +
        '/' +
        structuredFileName[0] +
        '-' +
        structuredFileName[1] +
        '-' +
        s3Constants.fileNameShortSizeSuffix +
        fileExtension;
    }
  }
}

module.exports = ResizeVideo;
