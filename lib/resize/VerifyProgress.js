/**
 * This module helps in checking progress of resize request happening on Lambda
 * @module lib/resize/VerifyProgress.js
 *
 */
const rootPrefix = '../..',
  BgJob = require(rootPrefix + '/lib/BgJob'),
  ImageCacheKlass = require(rootPrefix + '/lib/cacheManagement/multi/ImageByIds'),
  VideoCacheKlass = require(rootPrefix + '/lib/cacheManagement/multi/VideoByIds'),
  s3Constants = require(rootPrefix + '/lib/globalConstant/s3'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  videoConstants = require(rootPrefix + '/lib/globalConstant/video'),
  imageConstants = require(rootPrefix + '/lib/globalConstant/image'),
  shortToLongUrl = require(rootPrefix + '/lib/shortToLongUrl'),
  VideoModel = require(rootPrefix + '/app/models/mysql/Video'),
  ImageModel = require(rootPrefix + '/app/models/mysql/Image'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob'),
  s3Wrapper = require(rootPrefix + '/lib/aws/S3Wrapper');

/**
 * Class to verify resize progress of media, happening on lambda
 *
 */
class VerifyProgress {
  /**
   * Constructor
   *
   * @param params
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
  }

  /**
   * Perform function
   *
   */
  async perform() {
    const oThis = this;

    // Fetch media
    await oThis._fetchMedia();

    // Check whether media is resized
    await oThis._checkMediaResized();

    // Update status of the resize process
    await oThis._updateProgress();
  }

  /**
   * Fetch media from table to find resolutions details
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchMedia() {
    const oThis = this;

    let cacheResp = null,
      resizeSizes = null,
      kind = null;
    if (oThis.mediaKind == s3Constants.imageFileType) {
      resizeSizes = imageConstants.resizeSizes;
      cacheResp = await new ImageCacheKlass({ ids: [oThis.mediaId] }).fetch();
    } else if (oThis.mediaKind == s3Constants.videoFileType) {
      resizeSizes = videoConstants.compressionSizes;
      kind = videoConstants.userVideoKind;
      cacheResp = await new VideoCacheKlass({ ids: [oThis.mediaId] }).fetch();
    }

    if (cacheResp.isFailure() || !CommonValidators.validateNonEmptyObject(cacheResp.data[oThis.mediaId])) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_r_vp_1',
          api_error_identifier: 'invalid_media_id',
          debug_options: 'Invalid Media Id: ' + oThis.mediaId + ' kind: ' + oThis.mediaKind
        })
      );
    }

    oThis.mediaObj = cacheResp.data[oThis.mediaId];
    kind = kind || oThis.mediaObj.kind;

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
    for (let size in oThis.resizingSizes) {
      let resolutionObj = oThis.mediaObj.resolutions[size] || {};
      // If resolution object don't have size or width then check if file exists on s3
      if (!resolutionObj.size || !resolutionObj.width) {
        let fileName = shortToLongUrl.getCompleteFileName(oThis.mediaObj.urlTemplate, size),
          resp = await s3Wrapper.checkFileExists(fileName, oThis.mediaKind);

        if (resp.isSuccess()) {
          oThis.finalResolutions[size] = oThis.finalResolutions[size] || {};
          oThis.finalResolutions[size].size = resp.data.ContentLength;
          oThis.finalResolutions[size].width = resp.data.Metadata.width;
          oThis.finalResolutions[size].height = resp.data.Metadata.height;
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
    for (let size in oThis.resizingSizes) {
      // If width is not present for some sizes then mark resize process as incomplete or failed
      if (!oThis.finalResolutions[size] || !oThis.finalResolutions[size].width) {
        processPending = true;
      }
    }

    // Update media in db
    let status = '',
      isImage = oThis.mediaKind == s3Constants.imageFileType;
    // Process is complete
    if (!processPending) {
      status = isImage ? imageConstants.resizeDone : videoConstants.compressionDoneStatus;
    } else if (oThis.trialCount < 10) {
      // Process is still pending and more retry counts are available
      status = isImage ? imageConstants.resizeStarted : videoConstants.compressionStartedStatus;
      // Enqueue process after sometime again to re-verify
      let publishAfter = isImage ? 10000 : 30000;
      await BgJob.enqueue(
        bgJobConstants.checkResizeProgressJobTopic,
        { userId: oThis.userId, mediaId: oThis.mediaId, mediaKind: oThis.mediaKind, trialCount: oThis.trialCount + 1 },
        { publishAfter: publishAfter }
      );
    } else {
      status = isImage ? imageConstants.resizeFailed : videoConstants.compressionFailedStatus;
    }

    Object.assign(oThis.finalResolutions, { original: oThis.mediaObj.resolutions.original });
    if (isImage) {
      await oThis._updateImageEntity(status);
    } else {
      await oThis._updateVideoEntity(status);
    }
  }

  /**
   * Update video entity.
   *
   * @param {string} status
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateVideoEntity(status) {
    const oThis = this;

    await new VideoModel().updateVideo({
      id: oThis.mediaId,
      urlTemplate: oThis.mediaObj.urlTemplate,
      resolutions: oThis.finalResolutions,
      status: status
    });

    await VideoModel.flushCache({ id: oThis.mediaId });
  }

  /**
   * Update image entity.
   *
   * @param {string} status
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateImageEntity(status) {
    const oThis = this;

    await new ImageModel().updateImage({
      id: oThis.mediaId,
      urlTemplate: oThis.mediaObj.urlTemplate,
      resolutions: oThis.finalResolutions,
      status: status,
      shortenTwitterUrl: true
    });

    await ImageModel.flushCache({ id: oThis.mediaId });
  }
}

module.exports = VerifyProgress;
