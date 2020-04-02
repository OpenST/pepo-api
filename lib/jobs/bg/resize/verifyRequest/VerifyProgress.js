const rootPrefix = '../../../../..',
  VideoModel = require(rootPrefix + '/app/models/mysql/Video'),
  ImageModel = require(rootPrefix + '/app/models/mysql/Image'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ImageCacheKlass = require(rootPrefix + '/lib/cacheManagement/multi/ImageByIds'),
  VideoCacheKlass = require(rootPrefix + '/lib/cacheManagement/multi/VideoByIds'),
  s3Wrapper = require(rootPrefix + '/lib/aws/S3Wrapper'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  s3Constants = require(rootPrefix + '/lib/globalConstant/s3'),
  shortToLongUrl = require(rootPrefix + '/lib/shortToLongUrl'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  videoConstants = require(rootPrefix + '/lib/globalConstant/video'),
  imageConstants = require(rootPrefix + '/lib/globalConstant/image'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob');

/**
 * Class to verify resize progress of media, happening on lambda.
 *
 * @class VerifyProgress
 */
class VerifyProgress {
  /**
   * Constructor to verify resize progress of media, happening on lambda.
   *
   * @param {object} params
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.userId = params.userId;
    oThis.mediaId = params.mediaId;
    oThis.mediaKind = params.mediaKind;
    oThis.trialCount = params.trialCount;
    oThis.mediaObj = null;
    oThis.resizingSizes = null;
    oThis.finalResolutions = {};
    oThis.videoDuration = null;
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<*>}
   */
  async perform() {
    const oThis = this;

    // Fetch media.
    await oThis._fetchMedia();

    // Check whether media is resized.
    await oThis._checkMediaResized();

    // Update status of the resize process.
    await oThis._updateProgress();
  }

  /**
   * Fetch media from table to find resolutions details.
   *
   * @sets oThis.mediaObj, oThis.resizingSizes
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchMedia() {
    const oThis = this;

    let cacheResp = null,
      resizeSizes = null;

    switch (oThis.mediaKind) {
      case s3Constants.imageFileType: {
        resizeSizes = imageConstants.resizeSizes;
        cacheResp = await new ImageCacheKlass({ ids: [oThis.mediaId] }).fetch();
        // If source url is from external source, then original is also saved. So check for that image too.
        if (CommonValidators.validateNonEmptyObject(cacheResp.data[oThis.mediaId])) {
          let sourceUrl = cacheResp.data[oThis.mediaId].resolutions[imageConstants.originalResolution].url;
          if (imageConstants.isFromExternalSource(sourceUrl)) {
            let imageKind = cacheResp.data[oThis.mediaId].kind;
            resizeSizes[imageKind][imageConstants.originalResolution] = {};
          }
        }
        break;
      }
      case s3Constants.videoFileType: {
        resizeSizes = videoConstants.compressionSizes;
        cacheResp = await new VideoCacheKlass({ ids: [oThis.mediaId] }).fetch();
        break;
      }
      default: {
        throw new Error('Invalid media kind.');
      }
    }

    if (cacheResp.isFailure() || !CommonValidators.validateNonEmptyObject(cacheResp.data[oThis.mediaId])) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_j_b_r_vp_1',
          api_error_identifier: 'entity_not_found',
          debug_options: `Invalid Media Id: ${oThis.mediaId} kind: ${oThis.mediaKind}`
        })
      );
    }

    oThis.mediaObj = cacheResp.data[oThis.mediaId];
    const kind = oThis.mediaObj.kind;

    oThis.resizingSizes = resizeSizes[kind];
  }

  /**
   * Check whether media has resized for all sizes.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _checkMediaResized() {
    const oThis = this;

    // Check whether file is created for all required sizes
    for (const size in oThis.resizingSizes) {
      const resolutionObj = oThis.mediaObj.resolutions[size] || {};
      // If resolution object don't have size or width then check if file exists on s3
      if (!resolutionObj.size || !resolutionObj.width) {
        const fileName = shortToLongUrl.getCompleteFileName(oThis.mediaObj.urlTemplate, size),
          resp = await s3Wrapper.checkFileExists(fileName, oThis.mediaKind, {
            imageKind: oThis.mediaObj.kind
          });

        if (resp.isSuccess()) {
          oThis.finalResolutions[size] = oThis.finalResolutions[size] || {};
          oThis.finalResolutions[size].size = resp.data.ContentLength;
          oThis.finalResolutions[size].width = resp.data.Metadata.width;
          oThis.finalResolutions[size].height = resp.data.Metadata.height;
          if (oThis.mediaKind === s3Constants.videoFileType && resp.data.Metadata.duration) {
            oThis.videoDuration = resp.data.Metadata.duration;
          }
        }
      } else {
        oThis.finalResolutions[size] = resolutionObj;
      }
    }
  }

  /**
   * Update progress of the resize in db and take further actions.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateProgress() {
    const oThis = this;

    let processPending = false;
    for (const size in oThis.resizingSizes) {
      // If width is not present for some sizes then mark resize process as incomplete or failed
      if (!oThis.finalResolutions[size] || !oThis.finalResolutions[size].width) {
        processPending = true;
      }
    }

    // Update media in db.
    let resizeOrCompressionStatus = '';
    const isImage = oThis.mediaKind === s3Constants.imageFileType;
    // Process is complete.
    if (!processPending) {
      resizeOrCompressionStatus = isImage ? imageConstants.resizeDone : videoConstants.compressionDoneStatus;
    } else if (oThis.trialCount < 10) {
      // Process is still pending and more retry counts are available
      resizeOrCompressionStatus = isImage ? imageConstants.resizeStarted : videoConstants.compressionStartedStatus;
      // Enqueue process after sometime again to re-verify
      const publishAfter = isImage ? 10000 : 30000;
      await bgJob.enqueue(
        bgJobConstants.checkResizeProgressJobTopic,
        { userId: oThis.userId, mediaId: oThis.mediaId, mediaKind: oThis.mediaKind, trialCount: oThis.trialCount + 1 },
        { publishAfter: publishAfter }
      );
    } else {
      resizeOrCompressionStatus = isImage ? imageConstants.resizeFailed : videoConstants.compressionFailedStatus;
    }

    if (!oThis.finalResolutions.original) {
      Object.assign(oThis.finalResolutions, { original: oThis.mediaObj.resolutions.original });
    }
    if (isImage) {
      await oThis._updateImageEntity(resizeOrCompressionStatus);
    } else {
      await oThis._updateVideoEntity(resizeOrCompressionStatus);
    }
  }

  /**
   * Update video entity.
   *
   * @param {string} compressionStatus
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateVideoEntity(compressionStatus) {
    const oThis = this;

    // Update duration
    let extraData = oThis.mediaObj.extraData || {};
    if (oThis.videoDuration && !extraData.d) {
      extraData.d = oThis.videoDuration;
    }
    await new VideoModel().updateVideo({
      id: oThis.mediaId,
      urlTemplate: oThis.mediaObj.urlTemplate,
      resolutions: oThis.finalResolutions,
      compressionStatus: compressionStatus,
      extraData: extraData
    });

    await VideoModel.flushCache({ id: oThis.mediaId });
  }

  /**
   * Update image entity.
   *
   * @param {string} resizeStatus
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateImageEntity(resizeStatus) {
    const oThis = this;

    await new ImageModel().updateImage({
      userId: oThis.userId,
      id: oThis.mediaId,
      urlTemplate: oThis.mediaObj.urlTemplate,
      resolutions: oThis.finalResolutions,
      resizeStatus: resizeStatus
    });

    await ImageModel.flushCache({ id: oThis.mediaId });
  }
}

module.exports = VerifyProgress;
