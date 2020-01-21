const rootPrefix = '../../../../..',
  VideoMergeJobModel = require(rootPrefix + '/app/models/mysql/big/VideoMergeJob'),
  s3Wrapper = require(rootPrefix + '/lib/aws/S3Wrapper'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  s3Constants = require(rootPrefix + '/lib/globalConstant/s3'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
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
      await new VideoMergeJobModel().updateStatus(videoMergeJobConstants.doneStatus, oThis.jobId);
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

    const errorFileExists = await oThis._checkErrorFileExists();

    if (oThis.trialCount > 30 || errorFileExists) {
      await new VideoMergeJobModel().updateStatus(videoMergeJobConstants.failedStatus, oThis.jobId);

      return;
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
   * Check if error file exists
   *
   * @returns {Promise<*|boolean>}
   * @private
   */
  async _checkErrorFileExists() {
    const oThis = this;

    // https://dbvoeb7t6hffk.cloudfront.net/pepo-staging1000/ua/videos/1026-34242f1e719a661b57ea7358d4f9ef62-576w.mp4
    // https://dbvoeb7t6hffk.cloudfront.net/pepo-staging1000/logs/1026-34242f1e719a661b57ea7358d4f9ef62-576w-error.txt
    const fileArray = oThis.mergedVideoS3Url.split('/'),
      fileName = fileArray.pop(),
      splitFileName = fileName.split('.');

    fileArray.pop();
    fileArray.pop();

    splitFileName.pop();
    splitFileName[0] += '-error';
    splitFileName.push('txt');

    const errorFileName = splitFileName.join('.');

    logger.log('===Error file name', errorFileName);
    const resp = await s3Wrapper.checkFileExists(errorFileName, s3Constants.textFileType);

    return resp.isFailure();
  }
}

module.exports = VerifyVideoMerge;
