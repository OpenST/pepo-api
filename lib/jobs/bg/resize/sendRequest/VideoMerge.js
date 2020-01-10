const rootPrefix = '../../../../..',
  ResizeBase = require(rootPrefix + '/lib/jobs/bg/resize/sendRequest/Base'),
  VideoMergeJobModel = require(rootPrefix + '/app/models/mysql/VideoMergeJob'),
  VideoSegmentModel = require(rootPrefix + '/app/models/mysql/VideoSegment'),
  VideoMergeJobByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoMergeJobByIds'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  s3Constants = require(rootPrefix + '/lib/globalConstant/s3'),
  mediaResizer = require(rootPrefix + '/lib/providers/mediaResizer'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob'),
  videoMergeJobConstants = require(rootPrefix + '/lib/globalConstant/videoMergeJob');

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

    oThis.videoMergeParams = {
      merged_video_s3_url: oThis.mergedVideoS3Url,
      segment_urls: oThis.segmentVideoUrls,
      upload_details: {
        bucket: s3Constants.bucket(s3Constants.videoFileType),
        acl: oThis.getAcl(),
        region: oThis.getRegion()
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

    const resp = await mediaResizer.mergeVideoSegments(oThis.videoMergeParams);

    if (resp.isSuccess()) {
      await oThis._updateInMergeJobs(videoMergeJobConstants.inProgressStatus);

      await bgJob.enqueue(
        bgJobConstants.verifyVideoMergeJobTopic,
        { jobId: oThis.jobId, mergedVideoS3Url: oThis.mergedVideoS3Url },
        { publishAfter: 30000 }
      );
    } else {
      await oThis._updateInMergeJobs(videoMergeJobConstants.failedStatus);
    }
  }

  /**
   * Update job status.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateInMergeJobs(status) {
    const oThis = this;

    await new VideoMergeJobModel()
      .update(['status = ?', videoMergeJobConstants.invertedStatuses[status]])
      .where(['id = ?', oThis.jobId])
      .fire();

    await VideoMergeJobModel.flushCache({ ids: [oThis.jobId] });
  }
}

module.exports = VideoMerge;
