const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  VideoDetailsByUserIdCache = require(rootPrefix + '/lib/cacheManagement/single/VideoDetailsByUserIdPagination'),
  UserProfileElementModel = require(rootPrefix + '/app/models/mysql/UserProfileElement'),
  VideosModel = require(rootPrefix + '/app/models/mysql/Video'),
  VideoDetailsModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  ActivityLogModel = require(rootPrefix + '/app/models/mysql/AdminActivityLog'),
  FeedModel = require(rootPrefix + '/app/models/mysql/Feed'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  paginationConstants = require(rootPrefix + '/lib/globalConstant/pagination'),
  userProfileElementConst = require(rootPrefix + '/lib/globalConstant/userProfileElement'),
  videoDetailsConst = require(rootPrefix + '/lib/globalConstant/videoDetail'),
  adminActivityLogConst = require(rootPrefix + '/lib/globalConstant/adminActivityLogs'),
  feedConstants = require(rootPrefix + '/lib/globalConstant/feed');

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

    let promises = [];
    promises.push(oThis._deleteProfileElementIfRequired());
    promises.push(oThis._markVideoDeleted());
    promises.push(oThis._markVideoDetailDeleted());
    promises.push(oThis._deleteVideoFeeds());

    await Promise.all(promises);

    await oThis._logAdminActivity();

    return responseHelper.successWithData({});
  }

  /**
   * Log admin activity
   *
   * @return {Promise<void>}
   * @private
   */
  async _logAdminActivity() {
    const oThis = this;

    let activityLogObj = new ActivityLogModel({});

    await activityLogObj.insertAction({
      adminId: oThis.currentAdminId,
      actionOn: oThis.creatorUserId,
      action: adminActivityLogConst.deleteUserVideo,
      extraData: JSON.stringify({ vid: oThis.videoId })
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

    console.log('The oThis.videoDetails is : ', oThis.videoDetails);

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
  async _markVideoDetailDeleted() {
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

    let videoObj = new VideosModel();

    return videoObj.markVideoDeleted({ id: oThis.videoId });
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

    await feedObj
      .delete()
      .where({
        kind: feedConstants.invertedKinds[feedConstants.fanUpdateKind],
        primary_external_entity_id: oThis.videoId
      })
      .fire();
  }
}

module.exports = DeleteVideo;
