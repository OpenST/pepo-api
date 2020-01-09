const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  VideoMergeJobModel = require(rootPrefix + '/app/models/mysql/VideoMergeJob'),
  VideoSegmentModel = require(rootPrefix + '/app/models/mysql/VideoSegment'),
  videoMergeJobConstants = require(rootPrefix + '/lib/globalConstant/videoMergeJob'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class to merge video segments
 *
 * @class MergeSegments
 */
class MergeSegments extends ServiceBase {
  /**
   * Constructor to share video details.
   *
   * @param {object} params
   * @param {String} params.video_urls
   * @param {object} params.current_user
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.currentUserId = oThis.current_user.id;
    oThis.videoUrls = JSON.parse(params.video_urls);

    oThis.jobId = null;
  }

  /**
   * Async perform.
   *
   * @returns {Promise}
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
   * Insert in video merge job
   * @returns {Promise<void>}
   * @private
   */
  async _insertInVideoMergeJob() {
    const oThis = this;

    // TODO: Take care of merged url
    const response = await new VideoMergeJobModel().insertJob({
      userId: oThis.currentUserId,
      mergedUrl: ''
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
   * @returns {Promise<void>}
   * @private
   */
  async _prepareResponse() {
    const oThis = this;

    const currentTime = Math.floor(Date.now() / 1000);

    const response = {
      id: oThis.jobId,
      status: videoMergeJobConstants.notStartedStatus,
      merged_url: null,
      uts: currentTime
    };

    return responseHelper.successWithData(response);
  }
}

module.exports = MergeSegments;
