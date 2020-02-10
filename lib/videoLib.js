const rootPrefix = '..',
  VideoModel = require(rootPrefix + '/app/models/mysql/Video'),
  ReplyDetailsModel = require(rootPrefix + '/app/models/mysql/ReplyDetail'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  VideoDetailModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  imageLib = require(rootPrefix + '/lib/imageLib'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  s3Constants = require(rootPrefix + '/lib/globalConstant/s3'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob'),
  videoConstants = require(rootPrefix + '/lib/globalConstant/video'),
  videoDetailsConstants = require(rootPrefix + '/lib/globalConstant/videoDetail'),
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
   * @param {string} params.videoKind
   * @param {number} [params.size]
   * @param {number} [params.width]
   * @param {number} [params.height]
   * @param {string} [params.linkIds]
   * @param {string} params.videoUrl
   * @param {string} params.entityKind
   * @param {string} params.parentKind
   * @param {string} params.parentId
   * @param {string} params.status
   * @param {string/number} params.perReplyAmountInWei
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

    const videoInsertParams = {
      resolutions: videoObject,
      posterImageId: coverImageId,
      status: videoConstants.activeStatus,
      kind: params.videoKind,
      compressionStatus: videoConstants.notCompressedStatus
    };

    const videoRow = await new VideoModel().insertVideo(videoInsertParams),
      videoId = videoRow.insertId;

    let replyDetailId = null,
      videoDetailId = null;

    // Note: VideoDetail is specific to fan update and should have been inserted in FanVideo Service.
    if (params.videoKind === videoConstants.postVideoKind) {
      // Update video detail model.
      const videoDetailsInsertRsp = await new VideoDetailModel().insertVideo({
        userId: params.userId,
        videoId: videoId,
        linkIds: params.linkIds,
        perReplyAmountInWei: params.perReplyAmountInWei,
        status: videoDetailsConstants.activeStatus
      });

      videoDetailId = videoDetailsInsertRsp.insertId;
    } else if (params.videoKind === videoConstants.replyVideoKind) {
      // Update reply detail model.
      const replyInsertResp = await new ReplyDetailsModel().insertVideo({
        userId: params.userId,
        entityKind: params.entityKind,
        entityId: videoId,
        linkIds: params.linkIds,
        parentKind: params.parentKind,
        parentId: params.parentId
      });
      logger.log('replyInsertResp ========', replyInsertResp);

      replyDetailId = replyInsertResp.insertId;
    } else {
      throw new Error(`Invalid video kind-${params.videoKind}`);
    }

    // Enqueue video re-sizer.
    await bgJob.enqueue(bgJobConstants.videoResizer, { userId: params.userId, videoId: videoId });

    videoObject.posterImageId = coverImageId;

    return responseHelper.successWithData({
      video: videoObject,
      videoId: videoId,
      replyDetailId: replyDetailId,
      videoDetailId: videoDetailId
    });
  }

  /**
   * Shorten url from the full length url.
   *
   * @param {object} params
   * @param {string} params.videoUrl
   * @param {boolean} params.isExternalUrl
   * @param {number} params.userId
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

      if (
        CommonValidators.isVarNullOrUndefined(fileName) ||
        CommonValidators.isVarNullOrUndefined(shortEntity) ||
        !fileName.match(params.userId + '-')
      ) {
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
