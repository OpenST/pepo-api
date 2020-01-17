const rootPrefix = '../../../../..',
  VideoMergeJobModel = require(rootPrefix + '/app/models/mysql/big/VideoMergeJob'),
  s3Wrapper = require(rootPrefix + '/lib/aws/S3Wrapper'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  s3Constants = require(rootPrefix + '/lib/globalConstant/s3'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob'),
  videoMergeJobConstants = require(rootPrefix + '/lib/globalConstant/videoMergeJob');

/**
 * Class to verify video merge is done.
 *
 * @class VerifyVideoMerge
 */
class VerifyVideoMerge {
  /**
   * Constructor to verify video merge is done.
   *
   * @param {object} params
   * @param {number} params.jobId
   * @param {string} params.mergedVideoS3Url
   * @param {number} [params.trialCount]
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.jobId = params.jobId;
    oThis.mergedVideoS3Url = params.mergedVideoS3Url;
    oThis.trialCount = params.trialCount || 0;
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<*>}
   */
  async perform() {
    const oThis = this;

    // Check whether video segments are merged.
    await oThis._checkVideoMergeDone();
  }

  /**
   * Check whether video merge is done.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _checkVideoMergeDone() {
    const oThis = this;

    const fileName = oThis.mergedVideoS3Url.split('/').pop();

    const resp = await s3Wrapper.checkFileExists(fileName, s3Constants.videoFileType);

    if (resp.isFailure()) {
      await oThis._enqueueVerification();
    } else {
      await oThis._updateInMergeJobs();
    }
  }

  /**
   * Enqueue upload verification.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _enqueueVerification() {
    const oThis = this;

    if (oThis.trialCount > 30) {
      return;
      // TODO - santhosh - upload task id file from lambda if failed. If retry exceeds th OR file exists, then mark job as failed.
    }
    // Enqueue the same message after some time.
    const publishAfter = 5000; // 5 seconds.
    await bgJob.enqueue(
      bgJobConstants.verifyVideoMergeJobTopic,
      {
        jobId: oThis.jobId,
        mergedVideoS3Url: oThis.mergedVideoS3Url,
        trialCount: oThis.trialCount + 1
      },
      { publishAfter: publishAfter }
    );
  }

  /**
   * Update job status.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateInMergeJobs() {
    const oThis = this;

    await new VideoMergeJobModel()
      .update(['status = ?', videoMergeJobConstants.invertedStatuses[videoMergeJobConstants.doneStatus]])
      .where(['id = ?', oThis.jobId])
      .fire();

    await VideoMergeJobModel.flushCache({ ids: [oThis.jobId] });
  }
}

module.exports = VerifyVideoMerge;
