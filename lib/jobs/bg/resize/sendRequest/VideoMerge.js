const rootPrefix = '../../../../..',
  ResizeBase = require(rootPrefix + '/lib/jobs/bg/resize/sendRequest/Base'),
  VideoSegmentModel = require(rootPrefix + '/app/models/mysql/big/VideoSegment'),
  VideoMergeJobModel = require(rootPrefix + '/app/models/mysql/big/VideoMergeJob'),
  VideoMergeJobByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoMergeJobByIds'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  s3Constants = require(rootPrefix + '/lib/globalConstant/s3'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  mediaResizer = require(rootPrefix + '/lib/providers/mediaResizer'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob'),
  videoMergeJobConstants = require(rootPrefix + '/lib/globalConstant/big/videoMergeJob');

/**
 * Class to merge multiple videos.
 *
 * @class VideoMerge
 */
class VideoMerge extends ResizeBase {
  /**
   * Constructor to merge multiple video.
   *
   * @param {object} params
   * @param {number} params.jobId
   *
   * @augments ResizeBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.jobId = params.jobId;

    oThis.userId = null;
    oThis.mergedVideoS3Url = null;
    oThis.segmentVideoUrls = [];
    oThis.videoMergeParams = {};
  }

  /**
   * Fetch video segments.
   *
   * @sets oThis.mergedVideoS3Url, oThis.segmentVideoUrls
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchEntity() {
    const oThis = this;

    const cacheRsp = await new VideoMergeJobByIdsCache({ ids: [oThis.jobId] }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    const jobDetails = cacheRsp.data[oThis.jobId];

    oThis.userId = jobDetails.userId;
    oThis.mergedVideoS3Url = jobDetails.mergedUrl;

    const videoSegments = await new VideoSegmentModel().fetchSegmentsByJobId(oThis.jobId);

    for (let ind = 0; ind < videoSegments.length; ind++) {
      oThis.segmentVideoUrls.push(videoSegments[ind].segmentUrl);
    }
  }

  /**
   * Prepare request data for resizer.
   *
   * @private
   * @returns {Promise<*>}
   */
  async _prepareResizerRequestData() {
    const oThis = this;

    const completeFileName = oThis.mergedVideoS3Url.split('/').pop();

    oThis.videoMergeParams = {
      segment_urls: oThis.segmentVideoUrls,
      upload_details: {
        bucket: s3Constants.bucket(s3Constants.videoFileType),
        acl: oThis.getAcl(),
        region: oThis.getRegion(),
        file_path: coreConstants.S3_USER_VIDEOS_FOLDER + '/' + completeFileName
      }
    };
  }

  /**
   * Send request to resizer and mark in DB.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _sendResizerRequest() {
    const oThis = this;

    logger.info('=====videoMergeParams', oThis.videoMergeParams);

    const resp = await mediaResizer.mergeVideoSegments(oThis.videoMergeParams);

    if (resp.isSuccess()) {
      await new VideoMergeJobModel().updateStatus(videoMergeJobConstants.inProgressStatus, oThis.jobId);

      await bgJob.enqueue(
        bgJobConstants.verifyVideoMergeJobTopic,
        { jobId: oThis.jobId, mergedVideoS3Url: oThis.mergedVideoS3Url },
        { publishAfter: 30000 }
      );
    } else {
      await new VideoMergeJobModel().updateStatus(videoMergeJobConstants.failedStatus, oThis.jobId);
    }
  }
}

module.exports = VideoMerge;
