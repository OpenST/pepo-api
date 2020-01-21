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

  /**
   * Async perform.
   *
   * @returns {Promise<result>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchVideoMergeJob();

    await oThis._validateAndSanitize();

    return oThis._prepareResponse();
  }

  /**
   * Fetch video merge job.
   *
   * @sets oThis.jobDetails
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchVideoMergeJob() {
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
   * @private
   */
  async _validateAndSanitize() {
    const oThis = this;

    if (!CommonValidators.validateNonEmptyObject(oThis.jobDetails)) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_v_vms_2',
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
          internal_error_identifier: 'a_s_v_vms_3',
          api_error_identifier: 'invalid_api_params',
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
   * @returns {result}
   * @private
   */
  _prepareResponse() {
    const oThis = this;

    return responseHelper.successWithData({
      [entityTypeConstants.videoMergeJob]: oThis.jobDetails
    });
  }
}

module.exports = VideoMergeJobStatus;
