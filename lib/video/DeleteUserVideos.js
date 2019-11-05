const rootPrefix = '../../',
  FeedModel = require(rootPrefix + '/app/models/mysql/Feed'),
  VideoModel = require(rootPrefix + '/app/models/mysql/Video'),
  VideoTagModel = require(rootPrefix + '/app/models/mysql/VideoTag'),
  VideoDetailModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  AdminActivityLogModel = require(rootPrefix + '/app/models/mysql/AdminActivityLog'),
  DecrementWeightsAndRemoveVideoTags = require(rootPrefix + '/lib/video/DecrementWeightsAndRemoveVideoTags'),
  VideoByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoByIds'),
  ImageByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/ImageByIds'),
  feedConstants = require(rootPrefix + '/lib/globalConstant/feed'),
  s3Wrapper = require(rootPrefix + '/lib/aws/S3Wrapper'),
  s3Constants = require(rootPrefix + '/lib/globalConstant/s3'),
  cloudfrontWrapper = require(rootPrefix + '/lib/aws/CloudfrontWrapper'),
  shortToLongUrl = require(rootPrefix + '/lib/shortToLongUrl'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  adminActivityLogConstants = require(rootPrefix + '/lib/globalConstant/adminActivityLogs');

// Declare variables.
const batchSize = 100;

/**
 * Class to delete videos of user.
 *
 * @class DeleteUserVideos
 */
class DeleteUserVideos {
  /**
   * Constructor to delete videos of user.
   *
   * @param {object} params
   * @param {number} params.userId
   * @param {number} params.currentAdminId
   * @param {boolean} [params.isUserAction]
   * @param {array<number>} [params.videoIds]
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.userId = params.userId;
    oThis.currentAdminId = params.currentAdminId;
    oThis.isUserAction = params.isUserAction || false;
    oThis.videoIds = params.videoIds || [];
    oThis.entityKeys = [];
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    return oThis._asyncPerform();
  }

  /**
   * Async perform.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    const videoIdsLength =
      oThis.videoIds.length === 0 ? await oThis._fetchVideoIdsToBeDeleted() : oThis.videoIds.length;

    if (videoIdsLength === 0) {
      return responseHelper.successWithData({});
    }

    const promisesArray = [];

    // Perform operations in batches.
    for (let index = 0; index < videoIdsLength; index += batchSize) {
      const tempArray = oThis.videoIds.slice(index, index + batchSize);

      // Don't move inside promise array. Videos will not be found if you do so
      await oThis._changeS3Permissions(tempArray);
      await oThis._clearCdnCache();

      promisesArray.push(
        oThis._decrementVideoTagsWeight(tempArray),
        oThis._markVideosDeleted(tempArray),
        oThis._markVideoDetailsDeleted(tempArray),
        oThis._deleteVideoFeeds(tempArray),
        oThis._logAdminActivity(tempArray)
      );
    }

    await Promise.all(promisesArray);

    return responseHelper.successWithData({});
  }

  /**
   * Fetch video ids to be deleted.
   *
   * @sets oThis.videoIds
   *
   * @returns {Promise<number>}
   * @private
   */
  async _fetchVideoIdsToBeDeleted() {
    const oThis = this;

    const dbRows = await new VideoDetailModel()
      .select('video_id')
      .where({ creator_user_id: oThis.userId })
      .fire();

    for (let index = 0; index < dbRows.length; index++) {
      oThis.videoIds.push(dbRows[index].video_id);
    }

    return oThis.videoIds.length;
  }

  /**
   * Decrement video tags weight
   *
   * @param videoIds
   * @returns {Promise<never>}
   * @private
   */
  async _decrementVideoTagsWeight(videoIds) {
    const oThis = this;

    let promiseArray = [];

    for (let i = 0; i < videoIds.length; i++) {
      promiseArray.push(oThis._performOperationOnEachVideo(videoIds[i]));
    }

    await Promise.all(promiseArray);
  }

  /**
   * Fetch tag ids and decrement weights for those tag ids.
   *
   * @param videoId
   * @returns {Promise<void>}
   * @private
   */
  async _performOperationOnEachVideo(videoId) {
    const oThis = this;

    let queryRsp = await new VideoTagModel()
      .select('*')
      .where(['video_id = ?', videoId])
      .fire();

    if (queryRsp.length === 0) {
      return Promise.resolve();
    }

    let tagIdsArray = [];
    for (let i = 0; i < queryRsp.length; i++) {
      tagIdsArray.push(queryRsp[i].tag_id);
    }

    if (tagIdsArray.length === 0) {
      return Promise.resolve();
    }

    await new DecrementWeightsAndRemoveVideoTags({ tagIds: tagIdsArray, videoId: videoId }).perform();
  }

  /**
   * Mark deleted status in videos.
   *
   * @param {array<number>} videoIds
   *
   * @return {Promise<*>}
   * @private
   */
  async _markVideosDeleted(videoIds) {
    return new VideoModel().markVideosDeleted({ ids: videoIds });
  }

  /**
   * Mark deleted status in video details.
   *
   * @param {array<number>} videoIds
   *
   * @return {Promise<*>}
   * @private
   */
  async _markVideoDetailsDeleted(videoIds) {
    const oThis = this;

    return new VideoDetailModel().markDeleted({
      userId: oThis.userId,
      videoIds: videoIds
    });
  }

  /**
   * Delete video from feeds.
   *
   * @param {array<number>} videoIds
   *
   * @return {Promise<*>}
   * @private
   */
  async _deleteVideoFeeds(videoIds) {
    // Fetch feed ids.
    const dbRows = await new FeedModel()
      .select('id')
      .where({
        kind: feedConstants.invertedKinds[feedConstants.fanUpdateKind],
        primary_external_entity_id: videoIds
      })
      .fire();

    const feedIds = [];
    for (let index = 0; index < dbRows.length; index++) {
      feedIds.push(dbRows[index].id);
    }

    if (feedIds.length > 0) {
      await new FeedModel()
        .delete()
        .where({
          id: feedIds
        })
        .fire();

      await FeedModel.flushCache({ ids: feedIds });
    }
  }

  /**
   * Log admin activity.
   *
   * @param {array<number>} videoIds
   *
   * @return {Promise<*>}
   * @private
   */
  async _logAdminActivity(videoIds) {
    const oThis = this;

    // If oThis.currentAdminId not present, don't log activity.
    if (oThis.isUserAction) {
      return;
    }

    await new AdminActivityLogModel().insertAction({
      adminId: oThis.currentAdminId,
      actionOn: oThis.userId,
      action: adminActivityLogConstants.deleteUserVideos,
      extraData: JSON.stringify({ vids: videoIds })
    });
  }

  /**
   * Change s3 permissions to private for deleted video and poster image
   * @param videoIds
   * @returns {Promise<void>}
   * @private
   */
  async _changeS3Permissions(videoIds) {
    const oThis = this;

    const cacheRsp = await new VideoByIdCache({ ids: videoIds }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    const imageIds = [];

    // Change video permissions
    for (const videoId in cacheRsp.data) {
      const video = cacheRsp.data[videoId],
        posterImageId = video.posterImageId;

      if (posterImageId) {
        imageIds.push(posterImageId);
      }
    }

    await oThis._changePermissionsForAllResolutions(cacheRsp.data, 'videos'); // For videos

    // Change poster image permissions
    const imageCacheRsp = await new ImageByIdCache({ ids: imageIds }).fetch();

    if (imageCacheRsp.isFailure()) {
      return Promise.reject(imageCacheRsp);
    }

    await oThis._changePermissionsForAllResolutions(imageCacheRsp.data, 'images'); // For poster images
  }

  /**
   * Change permissions for all resolutions of an entity
   * @param entityHash
   * @param entityKind
   * @returns {Promise<void>}
   * @private
   */
  async _changePermissionsForAllResolutions(entityHash, entityKind) {
    const oThis = this;

    const promiseArray = [];
    for (const entityId in entityHash) {
      const entity = entityHash[entityId],
        resolutions = entity.resolutions,
        urlTemplate = entity.urlTemplate.match(/\/.*/g)[0];

      let pathPrefix = null;

      if (entityKind == 'images') {
        pathPrefix = coreConstants.S3_USER_IMAGES_FOLDER;
      } else {
        pathPrefix = coreConstants.S3_USER_VIDEOS_FOLDER;
      }

      let entityKeyPattern = '/' + pathPrefix + entity.urlTemplate.match(/\/.-*/g)[0];
      entityKeyPattern += '*'; // Select all with this pattern
      oThis.entityKeys.push(entityKeyPattern);

      for (let size in resolutions) {
        const bucket = coreConstants.S3_USER_ASSETS_BUCKET,
          entityKey = pathPrefix + shortToLongUrl.replaceSizeInUrlTemplate(urlTemplate, size);
        promiseArray.push(s3Wrapper.changeObjectPermissions(bucket, entityKey, s3Constants.privateAcl));
      }
    }

    await Promise.all(promiseArray);
  }

  /**
   * Clear cdn cache for deleted video and poster image
   *
   * @returns {Promise<void>}
   * @private
   */
  async _clearCdnCache() {
    const oThis = this;

    const promiseArray = [];

    for (let ind = 0; ind < oThis.entityKeys.length; ind++) {
      const path = oThis.entityKeys[ind];
      promiseArray.push(cloudfrontWrapper.invalidateCache([path]));
    }

    await Promise.all(promiseArray);
  }
}

module.exports = DeleteUserVideos;
