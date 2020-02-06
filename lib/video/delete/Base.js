const rootPrefix = '../../..',
  VideoModel = require(rootPrefix + '/app/models/mysql/Video'),
  VideoTagModel = require(rootPrefix + '/app/models/mysql/VideoTag'),
  VideoByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoByIds'),
  ImageByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/ImageByIds'),
  AdminActivityLogModel = require(rootPrefix + '/app/models/mysql/admin/AdminActivityLog'),
  s3Wrapper = require(rootPrefix + '/lib/aws/S3Wrapper'),
  s3Constants = require(rootPrefix + '/lib/globalConstant/s3'),
  shortToLongUrl = require(rootPrefix + '/lib/shortToLongUrl'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob'),
  adminActivityLogConstants = require(rootPrefix + '/lib/globalConstant/admin/adminActivityLogs'),
  cdnCacheInvalidationEnqueue = require(rootPrefix + '/lib/rabbitMqEnqueue/cdnCacheInvalidation');

/**
 * Base class of video deletion.
 *
 * @class VideoDeleteBase
 */
class VideoDeleteBase {
  /**
   * Constructor for base class of video deletion.
   *
   * @param {object} params
   * @param {boolean} [params.isUserAction]: isUserAction
   * @param {number} params.userId: User Id
   * @param {number} params.currentAdminId: currentAdminId
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.isUserAction = params.isUserAction || false;
    oThis.userId = params.userId;
    oThis.currentAdminId = params.currentAdminId;

    oThis.entityKeys = [];
    oThis.oldTagIdsMap = {};
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<*>}
   */
  perform() {
    const oThis = this;

    return oThis._asyncPerform();
  }

  /**
   * Perform operations on video ids.
   *
   * @param {array<number>} videoIds
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _performOperations(videoIds) {
    const oThis = this;

    const promisesArray = [];

    await oThis._decrementTagsWeight(videoIds);

    promisesArray.push(
      oThis._markVideosDeleted(videoIds),
      oThis._performSpecificActivities(videoIds),
      oThis._logAdminActivity(videoIds)
    );

    await Promise.all(promisesArray);

    // Don't move inside promise array. Videos will not be found if you do so.
    await oThis._changeS3Permissions(videoIds);
    await oThis._enqueueClearCdnCache();

    return responseHelper.successWithData({});
  }

  /**
   * Change s3 permissions to private for deleted video and poster image.
   *
   * @param {array<number>} videoIds
   *
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

    // Change video permissions.
    for (const videoId in cacheRsp.data) {
      const video = cacheRsp.data[videoId],
        posterImageId = video.posterImageId;

      if (posterImageId) {
        imageIds.push(posterImageId);
      }
    }

    await oThis._changePermissionsForAllResolutions(cacheRsp.data, 'videos'); // For videos.

    // Change poster image permissions.
    const imageCacheRsp = await new ImageByIdCache({ ids: imageIds }).fetch();
    if (imageCacheRsp.isFailure()) {
      return Promise.reject(imageCacheRsp);
    }

    await oThis._changePermissionsForAllResolutions(imageCacheRsp.data, 'images'); // For poster images.
  }

  /**
   * Change permissions for all resolutions of an entity.
   *
   * @param {object} entityHash
   * @param {string} entityKind
   *
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

      if (entityKind === 'images') {
        pathPrefix = coreConstants.S3_USER_IMAGES_FOLDER;
      } else {
        pathPrefix = coreConstants.S3_USER_VIDEOS_FOLDER;
      }

      let entityKeyPattern = '/' + pathPrefix + entity.urlTemplate.match(/\/.*-/g)[0];
      entityKeyPattern += '*'; // Select all with this pattern
      oThis.entityKeys.push(entityKeyPattern);

      for (const size in resolutions) {
        const bucket = coreConstants.S3_USER_ASSETS_BUCKET,
          entityKey = pathPrefix + shortToLongUrl.replaceSizeInUrlTemplate(urlTemplate, size);

        promiseArray.push(s3Wrapper.changeObjectPermissions(bucket, entityKey, s3Constants.privateAcl));
      }
    }

    await Promise.all(promiseArray);
  }

  /**
   * Clear cdn cache for deleted video and poster image.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _enqueueClearCdnCache() {
    const oThis = this;

    const promiseArray = [];

    for (let ind = 0; ind < oThis.entityKeys.length; ind++) {
      const path = oThis.entityKeys[ind];
      const enqueueParams = { pathArray: [path] };
      promiseArray.push(cdnCacheInvalidationEnqueue.enqueue(bgJobConstants.cdnCacheInvalidationTopic, enqueueParams));
    }

    await Promise.all(promiseArray);
  }

  /**
   * Decrement video tags weight.
   *
   * @param {array<number>} videoIds
   *
   * @returns {Promise<never>}
   * @private
   */
  async _decrementTagsWeight(videoIds) {
    const oThis = this;

    const promiseArray = [];

    for (let index = 0; index < videoIds.length; index++) {
      promiseArray.push(oThis._performOperationOnEachVideo(videoIds[index]));
    }

    await Promise.all(promiseArray);
  }

  /**
   * Fetch tag ids and decrement weights for those tag ids.
   *
   * @param {number} videoId
   *
   * @returns {Promise<void>}
   * @private
   */
  async _performOperationOnEachVideo(videoId) {
    const oThis = this;

    const queryRsp = await new VideoTagModel()
      .select('*')
      .where(['video_id = ?', videoId])
      .fire();

    if (queryRsp.length === 0) {
      return Promise.resolve();
    }

    const tagIdsArray = [];
    for (let index = 0; index < queryRsp.length; index++) {
      tagIdsArray.push(queryRsp[index].tag_id);
    }

    if (tagIdsArray.length === 0) {
      return;
    }

    oThis.oldTagIdsMap[videoId] = tagIdsArray;

    await oThis._decrementTagWeightAndRemoveVideoTag({ tagIds: tagIdsArray, videoId: videoId });
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
   * Fetch and set video ids to be deleted
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchAndSetVideosIds() {
    throw new Error('Unimplemented method _fetchAndSetVideosIds for Video delete.');
  }

  /**
   * Decrement tag weight and remove video tag.
   *
   * @returns {Promise<*>}
   * @private
   */
  async _decrementTagWeightAndRemoveVideoTag() {
    throw new Error('Unimplemented method _decrementTagWeightAndRemoveVideoTag for Video delete.');
  }

  /**
   * Mark details deleted.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _markDetailsDeleted() {
    throw new Error('Unimplemented method _markDetailsDeleted for Video delete.');
  }

  /**
   * Perform specific activities
   *
   * @returns {Promise<void>}
   * @private
   */
  async _performSpecificActivities() {
    throw new Error('Unimplemented method _performSpecificActivities for Video delete.');
  }
}

module.exports = VideoDeleteBase;
