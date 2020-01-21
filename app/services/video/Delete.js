const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  DeleteUserVideosLib = require(rootPrefix + '/lib/video/delete/UserVideos'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  videoDetailsConstants = require(rootPrefix + '/lib/globalConstant/videoDetail');

/**
 * Class to delete video by user.
 *
 * @class DeleteVideo
 */
class DeleteVideo extends ServiceBase {
  /**
   * Constructor to delete video by user.
   *
   * @param {object} params
   * @param {object} params.current_user
   * @param {number} params.video_id
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.currentUser = params.current_user;
    oThis.videoId = params.video_id;

    oThis.creatorUserId = null;
  }

  /**
   * Async perform.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchCreatorUserId();

    const deleteUserVideosRsp = await new DeleteUserVideosLib({
      userId: oThis.creatorUserId,
      videoIds: [oThis.videoId],
      isUserAction: true,
      isUserCreator: UserModel.isUserApprovedCreator(oThis.currentUser)
    }).perform();

    if (deleteUserVideosRsp && deleteUserVideosRsp.isSuccess()) {
      return responseHelper.successWithData({});
    }

    return Promise.reject(deleteUserVideosRsp);
  }

  /**
   * Fetch creator user id.
   *
   * @sets oThis.creatorUserId
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchCreatorUserId() {
    const oThis = this;

    const videoDetailsCacheResponse = await new VideoDetailsByVideoIdsCache({ videoIds: [oThis.videoId] }).fetch();
    if (videoDetailsCacheResponse.isFailure()) {
      return Promise.reject(videoDetailsCacheResponse);
    }

    const videoDetailsCacheData = videoDetailsCacheResponse.data;

    // If video not found or its not active.
    if (
      !CommonValidator.validateNonEmptyObject(videoDetailsCacheData[oThis.videoId]) ||
      videoDetailsCacheData[oThis.videoId].status === videoDetailsConstants.deletedStatus
    ) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_v_dl_3',
          api_error_identifier: 'entity_not_found',
          debug_options: {
            videoId: oThis.videoId
          }
        })
      );
    }

    if (videoDetailsCacheData[oThis.videoId].creatorUserId !== oThis.currentUser.id) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_v_dl_4',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_video_id'],
          debug_options: { videoId: oThis.videoId }
        })
      );
    }

    oThis.creatorUserId = videoDetailsCacheData[oThis.videoId].creatorUserId;
  }
}
module.exports = DeleteVideo;
