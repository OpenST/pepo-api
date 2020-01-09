const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  VideoSegmentModel = require(rootPrefix + '/app/models/mysql/VideoSegment'),
  VideoMergeJobModel = require(rootPrefix + '/app/models/mysql/VideoMergeJob'),
  videoMergeJobConstants = require(rootPrefix + '/lib/globalConstant/videoMergeJob'),
  videoConstants = require(rootPrefix + '/lib/globalConstant/video'),
  shortToLongUrl = require(rootPrefix + '/lib/shortToLongUrl'),
  s3Constants = require(rootPrefix + '/lib/globalConstant/s3'),
  util = require(rootPrefix + '/lib/util'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob');

/**
 * Class to merge video segments.
 *
 * @class MergeSegments
 */
class MergeSegments extends ServiceBase {
  /**
   * Constructor to merge video segments.
   *
   * @param {object} params
   * @param {string} params.video_urls
   * @param {object} params.current_user
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.videoUrls = JSON.parse(params.video_urls);
    oThis.currentUserId = params.current_user.id;

    oThis.jobId = null;
  }

  /**
   * Async perform.
   *
   * @returns {Promise<result>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._insertInVideoMergeJob();

    await oThis._insertInVideoSegments();

    await oThis._enqueueMergeJob();

    return oThis._prepareResponse();
  }

  /**
   * Insert in video merge job.
   *
   * @sets oThis.jobId
   *
   * @returns {Promise<void>}
   * @private
   */
  async _insertInVideoMergeJob() {
    const oThis = this;

    oThis.mergedVideoS3Url =
      s3Constants.videoShortUrlPrefix +
      '/' +
      util.getS3FileTemplatePrefix(oThis.currentUserId) +
      s3Constants.fileNameShortSizeSuffix +
      '.mp4';

    const response = await new VideoMergeJobModel().insertJob({
      userId: oThis.currentUserId,
      mergedUrl: oThis.mergedVideoS3Url
    });

    oThis.jobId = response.insertId;
  }

  /**
   * Insert in video segments
   * @returns {Promise<void>}
   * @private
   */
  async _insertInVideoSegments() {
    const oThis = this;

    const promiseArray = [];

    for (let ind = 0; ind < oThis.videoUrls.length; ind++) {
      const segmentUrl = oThis.videoUrls[ind].video_url; // TODO: Create a short url

      promiseArray.push(
        new VideoSegmentModel().insertSegment({
          jobId: oThis.jobId,
          segmentUrl: segmentUrl
        })
      );
    }

    await Promise.all(promiseArray);
  }

  /**
   * Enqueue merge background job
   * @returns {Promise<void>}
   * @private
   */
  async _enqueueMergeJob() {
    const oThis = this;

    const payload = {
      jobId: oThis.jobId
    };

    await bgJob.enqueue(bgJobConstants.videoMergeJobTopic, payload);
  }

  /**
   * Prepare final response
   *
   * @returns {Promise<result>}
   * @private
   */
  async _prepareResponse() {
    const oThis = this;

    const currentTime = Math.floor(Date.now() / 1000);

    const response = {
      id: oThis.jobId,
      status: videoMergeJobConstants.notStartedStatus,
      merged_url: shortToLongUrl.getFullUrl(oThis.mergedVideoS3Url, videoConstants.originalResolution),
      uts: currentTime
    };

    return responseHelper.successWithData(response);
  }
}

module.exports = MergeSegments;
