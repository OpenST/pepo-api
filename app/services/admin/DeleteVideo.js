const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  FeedModel = require(rootPrefix + '/app/models/mysql/Feed'),
  VideosModel = require(rootPrefix + '/app/models/mysql/Video'),
  VideoDetailsModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  ActivityLogModel = require(rootPrefix + '/app/models/mysql/AdminActivityLog'),
  UserProfileElementModel = require(rootPrefix + '/app/models/mysql/UserProfileElement'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  VideoDetailsByUserIdCache = require(rootPrefix + '/lib/cacheManagement/single/VideoDetailsByUserIdPagination'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  feedConstants = require(rootPrefix + '/lib/globalConstant/feed'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination'),
  videoDetailsConstants = require(rootPrefix + '/lib/globalConstant/videoDetail'),
  adminActivityLogConstants = require(rootPrefix + '/lib/globalConstant/adminActivityLogs'),
  userProfileElementConstants = require(rootPrefix + '/lib/globalConstant/userProfileElement');

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

    // Unknown video or already deleted
    if (!oThis.creatorUserId || oThis.videoDetails[0].status === videoDetailsConstants.deletedStatus) {
      responseHelper.paramValidationError({
        internal_error_identifier: 'a_s_v_d_1',
        api_error_identifier: 'invalid_api_params',
        params_error_identifiers: ['invalid_video_id'],
        debug_options: { transfers: oThis.transfersData }
      });
    }

    const promises = [];
    promises.push(oThis._deleteProfileElementIfRequired());
    promises.push(oThis._markVideoDeleted());
    promises.push(oThis._markVideoDetailDeleted());
    promises.push(oThis._deleteVideoFeeds());

    await Promise.all(promises);

    await oThis._logAdminActivity();

    return responseHelper.successWithData({});
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
   * Delete profile element if required.
   *
   * @return {Promise<void>}
   * @private
   */
  async _deleteProfileElementIfRequired() {
    const oThis = this;

    // Todo::@Shlok why fetch again? user profile element should not have video. Ask Pankaj

    const cacheResponse = await new VideoDetailsByUserIdCache({
      userId: oThis.creatorUserId,
      limit: paginationConstants.defaultVideoListPageSize,
      paginationTimestamp: null
    }).fetch();

    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    // If deleted from profile element then there will be i
    const videoIds = cacheResponse.data.videoIds || [];

    if (videoIds[0] == oThis.videoId) {
      const profileElementObj = new UserProfileElementModel({});

      await profileElementObj.deleteByUserIdAndKind({
        userId: oThis.creatorUserId,
        dataKind: userProfileElementConstants.coverVideoIdKind
      });
    }
  }

  /**
   * Delete from video details.
   *
   * @return {Promise<*>}
   * @private
   */
  async _markVideoDetailDeleted() {
    const oThis = this;

    return new VideoDetailsModel().markDeleted({
      userId: oThis.creatorUserId,
      videoId: oThis.videoId
    });
  }

  /**
   * Mark status in videos.
   *
   * @return {Promise<void>}
   * @private
   */
  async _markVideoDeleted() {
    const oThis = this;

    return new VideosModel().markVideosDeleted({ ids: [oThis.videoId] });
  }

  /**
   * Delete video from feeds.
   *
   * @return {Promise<void>}
   * @private
   */
  async _deleteVideoFeeds() {
    const oThis = this;

    return new FeedModel()
      .delete()
      .where({
        kind: feedConstants.invertedKinds[feedConstants.fanUpdateKind],
        primary_external_entity_id: oThis.videoId
      })
      .fire();
  }
}

module.exports = DeleteVideo;
