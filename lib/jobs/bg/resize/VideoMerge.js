const rootPrefix = '../../../..',
  ResizeBase = require(rootPrefix + '/lib/jobs/bg/resize/Base'),
  VideoMergeJobModel = require(rootPrefix + '/app/models/mysql/VideoMergeJob');

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
   * @param {number} params.userId
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

    oThis.videoSegments = [];
  }

  /**
   * Fetch video segments.
   *
   * @sets oThis.videoSegments
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchEntity() {
    const oThis = this;

    oThis.videoSegments = await new VideoMergeJobModel().fetchSegmentsByJobId(oThis.jobId);
  }

  /**
   * Prepare request data for resizer.
   *
   * @private
   * @returns {Promise<*>}
   */
  async _prepareResizerRequestData() {
    const oThis = this;
  }

  /**
   * Send request to resizer and mark in DB.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _sendResizerRequest() {
    const oThis = this;
  }
}

module.exports = VideoMerge;
