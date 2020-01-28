/**
 * One time to populate transactions data.
 *
 * Usage: node executables/oneTimers/enqueueVideosDataForWatermarkPurpose.js
 *
 * @module executables/oneTimers/enqueueVideosDataForWatermarkPurpose
 */
const command = require('commander');

const rootPrefix = '../..',
  basicHelper = require(rootPrefix + '/helpers/basic'),
  s3Wrapper = require(rootPrefix + '/lib/aws/S3Wrapper'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  shortToLongUrl = require(rootPrefix + '/lib/shortToLongUrl'),
  s3Constants = require(rootPrefix + '/lib/globalConstant/s3'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  videoConstants = require(rootPrefix + '/lib/globalConstant/video'),
  mediaResizer = require(rootPrefix + '/lib/providers/mediaResizer'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob'),
  VideoModel = require(rootPrefix + '/app/models/mysql/Video'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

const BATCH_SIZE = 25;

command
  .version('0.1.0')
  .usage('[options]')
  .option('-f, --videoId <videoId>', 'id of the videos table')
  .parse(process.argv);

/**
 * class for populate transactions data
 *
 * @class PopulateTransactionsData
 */
class EnqueueVideosDataForWatermarkPurpose {
  /**
   * constructor to populate transactions data
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.totalRowsFound = null;
    oThis.videoIdToStart = null;
    oThis.videoId = null;
    oThis.userId = null;
    oThis.video = null;
    oThis.notProcessedVideoIds = [];
  }

  /**
   * Perform
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis._performBatch();
  }

  /**
   * Perform batch
   *
   * @returns {Promise<void>}
   * @private
   */
  async _performBatch() {
    const oThis = this;

    oThis.videoIdToStart = command.videoId ? command.videoId : 0;

    let limit = BATCH_SIZE,
      offset = 0;
    while (true) {
      await oThis._fetchVideos(limit, offset);
      // No more records present to migrate
      if (oThis.totalRowsFound === 0) {
        break;
      }

      offset = offset + BATCH_SIZE;
    }

    logger.log('The oThis.notProcessedVideoIds are : ', oThis.notProcessedVideoIds);
  }

  /**
   * Fetch transaction
   *
   * @param limit
   * @param offset
   * @returns {Promise<void>}
   * @private
   */
  async _fetchVideos(limit, offset) {
    const oThis = this;

    let videosData = await new VideoModel()
      .select('*')
      .where(['id > (?)', oThis.videoIdToStart])
      .order_by('id asc')
      .limit(limit)
      .offset(offset)
      .fire();

    oThis.totalRowsFound = videosData.length;

    if (oThis.totalRowsFound == 0) {
      return;
    }

    let videoIdToVideoMap = {};

    let videoIds = [];
    for (let index = 0; index < videosData.length; index++) {
      let formatDbRow = new VideoModel()._formatDbData(videosData[index]);
      oThis.videoId = formatDbRow.id;

      if (true || formatDbRow.compressionStatus === videoConstants.compressionDoneStatus) {
        oThis.video = formatDbRow;

        if (!oThis.videoId) {
          return Promise.reject(
            responseHelper.error({
              internal_error_identifier: 'e_ot_evdfwp_1',
              api_error_identifier: 'something_went_wrong',
              debug_options: { videoId: oThis.videoId }
            })
          );
        }

        let resolutions = oThis.video.resolutions,
          externalResolution = resolutions['e'];

        if (CommonValidators.validateNonEmptyObject(externalResolution)) {
          continue;
        }

        await oThis._prepareResizerRequestData();
        await oThis._sendResizerRequest();
      } else {
        oThis.notProcessedVideoIds.push(videoId);
      }
    }
  }

  /**
   * Update entity.
   *
   * @param {string} compressionStatus
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateEntity(compressionStatus) {
    const oThis = this;

    await new VideoModel().updateVideo({
      id: oThis.videoId,
      urlTemplate: oThis.video.urlTemplate,
      resolutions: oThis.video.resolutions,
      compressionStatus: compressionStatus
    });

    await VideoModel.flushCache({ id: oThis.videoId });

    if (compressionStatus === videoConstants.compressionFailedStatus) {
      logger.error('Failed to compress the video');
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'e_ot_evdfwp_2',
          api_error_identifier: 'something_went_wrong',
          debug_options: ''
        })
      );
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

    let sourceUrl = null;

    const urlToUse =
      oThis.video.resolutions.o && oThis.video.resolutions.o.u ? oThis.video.resolutions.o.u : oThis.video.urlTemplate;

    oThis.userId = urlToUse.split('/')[1].split('-')[0];

    if (!oThis.userId) {
      throw new Error(`invalid user id - ${oThis.userId}`);
    }

    const fileName = shortToLongUrl.getCompleteFileName(urlToUse, videoConstants.originalResolution);

    let urlExpiry = 60 * 60;
    sourceUrl = await s3Wrapper.getSignedUrl(fileName, s3Constants.videoFileType, urlExpiry);

    oThis.compressData = {
      source_url: sourceUrl,
      upload_details: {
        bucket: s3Constants.bucket(s3Constants.videoFileType),
        acl: oThis.getAcl(),
        region: oThis.getRegion()
      },
      compression_data: {}
    };

    const videoKind = oThis.video.kind;
    const sizesToGenerate = videoConstants.compressionSizes[videoKind];
    const contentType = 'video/mp4';

    for (const sizeName in sizesToGenerate) {
      if (sizeName === videoConstants.externalResolution) {
        const sizeDetails = sizesToGenerate[sizeName];
        const resizeData = oThis._setResizeDetails(
          sizeName,
          sizeDetails,
          contentType,
          urlToUse,
          coreConstants.S3_USER_VIDEOS_FOLDER
        );

        if (!basicHelper.isEmptyObject(resizeData)) {
          oThis.compressData.compression_data[sizeName] = resizeData;
        }
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

    logger.log('\n\n\nThe oThis.compressData is : ', oThis.compressData);

    const resp = await mediaResizer.compressVideo(oThis.compressData);
    if (resp.isFailure()) {
      await oThis._updateEntity(videoConstants.compressionFailedStatus);
      return responseHelper.successWithData({});
    }

    await bgJob.enqueue(
      bgJobConstants.checkResizeProgressJobTopic,
      { userId: oThis.userId, mediaId: oThis.videoId, mediaKind: s3Constants.videoFileType, trialCount: 1 },
      { publishAfter: 30000 }
    );

    return responseHelper.successWithData({});
  }

  /**
   * Get access control list.
   *
   * @returns {string}
   */
  getAcl() {
    return s3Constants.publicReadAcl;
  }

  /**
   * Get AWS region.
   *
   * @returns {string}
   */
  getRegion() {
    return coreConstants.AWS_REGION;
  }

  /**
   * Set resize details for all sizes.
   *
   * @param {string} sizeName
   * @param {object} sizeDetails
   * @param {string} contentType
   * @param {string} urlTemplate
   * @param {string} s3Folder
   *
   * @returns {{}}
   * @private
   */
  _setResizeDetails(sizeName, sizeDetails, contentType, urlTemplate, s3Folder) {
    const oThis = this;

    const resizeDetails = {};

    // If resize all flag is set, then following check is not performed.
    if (sizeDetails.width) {
      resizeDetails.width = sizeDetails.width;
    }

    if (sizeDetails.height) {
      resizeDetails.height = sizeDetails.height;
    }

    resizeDetails.content_type = contentType;

    const completeFileName = shortToLongUrl.getCompleteFileName(urlTemplate, sizeName);

    resizeDetails.file_path = s3Folder + '/' + completeFileName;
    resizeDetails.s3_url = shortToLongUrl.getFullUrlInternal(urlTemplate, sizeName);

    return resizeDetails;
  }
}

new EnqueueVideosDataForWatermarkPurpose({})
  .perform()
  .then(function(rsp) {
    logger.log('Completed Successfully!!!');
    process.exit(0);
  })
  .catch(function(err) {
    logger.log(err);
    process.exit(1);
  });
