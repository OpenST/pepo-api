const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  VideoDetailsByUserIdCache = require(rootPrefix + '/lib/cacheManagement/single/VideoDetailsByUserIdPagination'),
  UserProfileElementModel = require(rootPrefix + '/app/models/mysql/UserProfileElement'),
  VideosModel = require(rootPrefix + '/app/models/mysql/Video'),
  VideoDetailsModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  ActivityLogModel = require(rootPrefix + '/app/models/mysql/ActivityLog'),
  FeedModel = require(rootPrefix + '/app/models/mysql/Feed'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination'),
  userProfileElementConst = require(rootPrefix + '/lib/globalConstant/userProfileElement'),
  videoDetailsConst = require(rootPrefix + '/lib/globalConstant/videoDetail'),
  adminActivityLogConst = require(rootPrefix + '/lib/globalConstant/adminActivityLogs');

class DeleteVideo extends ServiceBase {
  /**
   * @constructor
   *
   * @param params
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.videoId = params.video_id;
    oThis.currentAdmin = params.current_admin;

    oThis.currentAdminId = null;
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
    if (!oThis.creatorUserId || oThis.videoDetails[0].status == videoDetailsConst.deletedStatus) {
      return responseHelper.successWithData({});
    }

    await oThis._logAdminActivity();

    await oThis._deleteProfileElementIfRequired();

    await oThis._markVideoDeleted();

    await oThis._markeVideoDetailDeleted();

    await oThis._deleteVideoFeeds();

    return responseHelper.successWithData({});
  }

  /**
   * Fetch creator user id
   *
   * @sets oThis.creatorUserId
   * @return {Promise<void>}
   * @private
   */
  async _logAdminActivity() {
    const oThis = this;

    let activityLogObj = new ActivityLogModel({});

    await activityLogObj.insertAction({
      adminId: oThis.currentAdminId,
      actionKind: adminActivityLogConst.deleteVideo,
      data: oThis.creatorUserId
    });
  }

  /**
   * Fetch creator user id
   *
   * @sets oThis.creatorUserId
   * @return {Promise<void>}
   * @private
   */
  async _fetchCreatorUserId() {
    const oThis = this;

    let videoDetailsCacheResponse = await new VideoDetailsByVideoIdsCache({ videoIds: [oThis.videoId] }).fetch();

    if (videoDetailsCacheResponse.isFailure()) {
      return Promise.reject(videoDetailsCacheResponse);
    }

    oThis.videoDetails = [videoDetailsCacheResponse.data[oThis.videoId]];

    oThis.creatorUserId = oThis.videoDetails[0].creatorUserId;

    oThis.currentAdminId = oThis.currentAdmin ? Number(oThis.currentAdmin.id) : 0;
  }

  /**
   * Delete profile element if required
   *
   * @return {Promise<void>}
   * @private
   */
  async _deleteProfileElementIfRequired() {
    const oThis = this;

    const cacheResponse = await new VideoDetailsByUserIdCache({
      userId: oThis.creatorUserId,
      limit: paginationConstants.defaultVideoListPageSize,
      paginationTimestamp: null
    }).fetch();

    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    let videoIds = cacheResponse.data.videoIds || [];

    if (videoIds[0] == oThis.videoId) {
      let profileElementObj = new UserProfileElementModel({});

      await profileElementObj.deleteByUserIdAndKind({
        userId: oThis.creatorUserId,
        dataKind: userProfileElementConst.coverVideoIdKind
      });
    }
  }

  /**
   * Delete from video details
   *
   * @return {Promise<void>}
   * @private
   */
  async _markeVideoDetailDeleted() {
    const oThis = this;

    let videoDetailsObj = new VideoDetailsModel({});

    await videoDetailsObj.markDeleted({
      userId: oThis.creatorUserId,
      videoId: oThis.videoId
    });
  }

  /**
   * Mark status in videos
   *
   * @return {Promise<void>}
   * @private
   */
  async _markVideoDeleted() {
    const oThis = this;

    return new VideosModel().markVideoDeleted({ id: oThis.videoId });
  }

  /**
   * Delete video from feeds
   *
   * @return {Promise<void>}
   * @private
   */
  async _deleteVideoFeeds() {
    const oThis = this;

    let feedObj = new FeedModel({});

    await feedObj.deleteByActor({
      actor: oThis.creatorUserId
    });
  }
}

module.exports = DeleteVideo;
