const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  VideoMergeJobByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoMergeJobByIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType');

/**
 * Class to get video merge job status.
 *
 * @class VideoMergeJobStatus
 */
class VideoMergeJobStatus extends ServiceBase {
  /**
   * Constructor to get video merge job status.
   *
   * @param {object} params
   * @param {object} params.current_user
   * @param {object} params.video_merge_job_id
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.currentUser = params.current_user;
    oThis.jobId = params.video_merge_job_id;

    oThis.jobDetails = {};
  }

  async _asyncPerform() {
    const oThis = this;

    await oThis.fetchVideoMergeJob();

    await oThis.validateAndSanitize();

    return responseHelper.successWithData(oThis._prepareResponse());
  }

  /**
   * Fetch video merge job.
   *
   * @sets oThis.jobDetails
   *
   * @returns {Promise<never>}
   */
  async fetchVideoMergeJob() {
    const oThis = this;

    const cacheResponse = await new VideoMergeJobByIdsCache({ ids: [oThis.jobId] }).fetch();
    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    oThis.jobDetails = cacheResponse.data[oThis.jobId];
  }

  /**
   * Validate and sanitize.
   *
   * @returns {Promise<never>}
   */
  async validateAndSanitize() {
    const oThis = this;

    if (!CommonValidators.validateNonEmptyObject(oThis.jobDetails)) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_v_vms_1',
          api_error_identifier: 'entity_not_found',
          debug_options: {
            jobId: oThis.jobId
          }
        })
      );
    }

    if (+oThis.jobDetails.userId !== +oThis.currentUser.id) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_v_vms_2',
          api_error_identifier: 'entity_not_found',
          debug_options: {
            jobId: oThis.jobId,
            jobDetailUserId: oThis.jobDetails.userId,
            currentUserId: oThis.currentUser.id
          }
        })
      );
    }
  }

  /**
   * Prepare response.
   *
   * @returns {{}}
   * @private
   */
  _prepareResponse() {
    const oThis = this;

    return {
      [entityTypeConstants.videoMergeJob]: oThis.jobDetails
    };
  }
}

module.exports = VideoMergeJobStatus;
