const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  videoMergeJobConstants = require(rootPrefix + '/lib/globalConstant/big/videoMergeJob');

/**
 * Class for video merge job formatter.
 *
 * @class VideoMergeJobSingleFormatter
 */
class VideoMergeJobSingleFormatter extends BaseFormatter {
  /**
   * Constructor for video merge job formatter.
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

    const mergedUrl =
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
