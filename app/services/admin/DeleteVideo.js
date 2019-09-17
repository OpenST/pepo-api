const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  DeleteUserVideos = require(rootPrefix + '/lib/video/DeleteUserVideos'),
  ActivityLogModel = require(rootPrefix + '/app/models/mysql/AdminActivityLog'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  videoDetailsConstants = require(rootPrefix + '/lib/globalConstant/videoDetail'),
  adminActivityLogConstants = require(rootPrefix + '/lib/globalConstant/adminActivityLogs');

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
      responseHelper.paramValidationError({
        internal_error_identifier: 'a_s_v_d_1',
        api_error_identifier: 'invalid_api_params',
        params_error_identifiers: ['invalid_video_id'],
        debug_options: { transfers: oThis.transfersData }
      });
    }

    const promisesArray = [];
    promisesArray.push(new DeleteUserVideos({ userId: oThis.creatorUserId, videoIds: [oThis.videoId] }));
    promisesArray.push(oThis._logAdminActivity());
    await Promise.all(promisesArray);

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
  }

  /**
   * Log admin activity.
   *
   * @return {Promise<void>}
   * @private
   */
  async _logAdminActivity() {
    const oThis = this;

    await new ActivityLogModel().insertAction({
      adminId: oThis.currentAdminId,
      actionOn: oThis.creatorUserId,
      action: adminActivityLogConstants.deleteUserVideo,
      extraData: JSON.stringify({ vid: oThis.videoId })
    });
  }
}

module.exports = DeleteVideo;
