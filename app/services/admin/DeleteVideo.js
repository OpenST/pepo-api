const rootPrefix = '../../..',
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  UsersCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob'),
  videoDetailsConstants = require(rootPrefix + '/lib/globalConstant/videoDetail');

/**
 * Class to delete video.
 *
 * @class DeleteVideo
 */
class DeleteVideo extends ServiceBase {
  /**
   * Constructor to delete video.
   *
   * @param {object} params
   * @param {number} params.video_id
   * @param {object} params.current_admin
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.videoId = params.video_id;
    oThis.currentAdmin = params.current_admin;

    oThis.currentAdminId = Number(oThis.currentAdmin.id);
    oThis.creatorUserId = null;
    oThis.user = null;
  }

  /**
   * Async perform.
   *
   * @return {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchCreatorUserId();

    // Unknown video or already deleted.
    if (!oThis.creatorUserId || oThis.videoDetails[0].status === videoDetailsConstants.deletedStatus) {
      return responseHelper.paramValidationError({
        internal_error_identifier: 'a_s_v_d_1',
        api_error_identifier: 'invalid_api_params',
        params_error_identifiers: ['invalid_video_id'],
        debug_options: { videoDetails: oThis.videoDetails }
      });
    }

    await bgJob.enqueue(bgJobConstants.deleteUserVideosJobTopic, {
      userId: oThis.creatorUserId,
      currentAdminId: oThis.currentAdminId,
      videoIds: [oThis.videoId],
      isUserCreator: UserModel.isUserApprovedCreator(oThis.user)
    });

    return responseHelper.successWithData({});
  }

  /**
   * Fetch creator user id.
   *
   * @sets oThis.videoDetails, oThis.creatorUserId
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchCreatorUserId() {
    const oThis = this;

    const videoDetailsCacheResponse = await new VideoDetailsByVideoIdsCache({ videoIds: [oThis.videoId] }).fetch();
    if (videoDetailsCacheResponse.isFailure()) {
      return Promise.reject(videoDetailsCacheResponse);
    }

    oThis.videoDetails = [videoDetailsCacheResponse.data[oThis.videoId]];
    oThis.creatorUserId = oThis.videoDetails[0].creatorUserId;

    const cacheRsp = await new UsersCache({ ids: [oThis.creatorUserId] }).fetch();
    if (cacheRsp.isFailure()) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_a_dv_fcui_1',
          api_error_identifier: 'invalid_params',
          params_error_identifiers: ['invalid_user_id'],
          debug_options: {}
        })
      );
    }

    oThis.user = cacheRsp.data[oThis.creatorUserId];
  }
}

module.exports = DeleteVideo;
