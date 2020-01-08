const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  videoMergeJobConstants = require(rootPrefix + '/lib/globalConstant/videoMergeJob'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for get invite code Details formatter.
 *
 * @class VideoMergeJobSingleFormatter
 */
class VideoMergeJobSingleFormatter extends BaseFormatter {
  /**
   * Constructor for get invite code Details formatter.
   *
   * @param {object} params
   * @param {object} params.videoMergeJob
   *
   * @param {number} params.videoMergeJob.id
   * @param {string} params.videoMergeJob.merged_url
   * @param {number} params.videoMergeJob.createdAt
   * @param {number} params.videoMergeJob.updatedAt
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.videoMergeJob = params.videoMergeJob;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const inviteCodeKeyConfig = {
      id: { isNullAllowed: false },
      status: { isNullAllowed: false },
      mergedUrl: { isNullAllowed: true },
      createdAt: { isNullAllowed: false },
      updatedAt: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.videoMergeJob, inviteCodeKeyConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {*|result|*}
   * @private
   */
  _format() {
    const oThis = this;

    let mergedUrl =
      oThis.videoMergeJob.status === videoMergeJobConstants.doneStatus ? oThis.videoMergeJob.mergedUrl : null;

    return responseHelper.successWithData({
      id: Number(oThis.videoMergeJob.id),
      status: oThis.videoMergeJob.status,
      merged_url: mergedUrl,
      uts: Number(oThis.videoMergeJob.updatedAt)
    });
  }
}

module.exports = VideoMergeJobSingleFormatter;
