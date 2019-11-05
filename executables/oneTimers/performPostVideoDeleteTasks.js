const rootPrefix = '../..',
  VideoModel = require(rootPrefix + '/app/models/mysql/Video'),
  ImageModel = require(rootPrefix + '/app/models/mysql/Image'),
  s3Wrapper = require(rootPrefix + '/lib/aws/S3Wrapper'),
  cloudfrontWrapper = require(rootPrefix + '/lib/aws/CloudfrontWrapper'),
  videoConstants = require(rootPrefix + '/lib/globalConstant/video'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  s3Constants = require(rootPrefix + '/lib/globalConstant/s3'),
  shortToLongUrl = require(rootPrefix + '/lib/shortToLongUrl'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

class PerformPostVideoDeleteTasks {
  constructor() {
    const oThis = this;

    oThis.entityKeys = [];
    oThis.imageIds = [];
  }

  /**
   * Perform
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis._changeS3PermissionsForVideos();

    await oThis._changeS3PermissionsForImages();

    await oThis._invalidateCdnCache();
  }

  /**
   * Change s3 permissions for all deleted videos
   * @returns {Promise<void>}
   * @private
   */
  async _changeS3PermissionsForVideos() {
    const oThis = this;

    let offset = 0,
      pageNo = 1,
      Rows = ['dummy'];

    const promiseArray = [];

    while (Rows.length > 0) {
      offset = (pageNo - 1) * 50;
      Rows = await new VideoModel()
        .select('id, url_template, poster_image_id, resolutions')
        .where({ status: videoConstants.invertedStatuses[videoConstants.deletedStatus] })
        .limit(50)
        .offset(offset)
        .fire();

      pageNo += 1;

      for (let ind = 0; ind < Rows.length; ind++) {
        const formattedData = VideoModel._formatDbData(Rows[ind]);
        promiseArray.push(oThis._changePermissionsForAllResolutions(formattedData, 'videos'));
      }
    }

    await Promise.all(promiseArray);
  }

  /**
   * Change s3 permissions for images
   * @returns {Promise<void>}
   * @private
   */
  async _changeS3PermissionsForImages() {
    const oThis = this;

    const promiseArray = [];
    while (oThis.imageIds.length > 0) {
      const imageIds = oThis.imageIds.splice(0, 50);

      const Rows = await new ImageModel()
        .select('id, url_template, resolutions')
        .where({ id: imageIds })
        .fire();

      for (let ind = 0; ind < Rows.length; ind++) {
        const formattedData = VideoModel._formatDbData(Rows[ind]);
        promiseArray.push(oThis._changePermissionsForAllResolutions(formattedData, 'images'));
      }
    }

    await Promise.all(promiseArray);
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

    const promiseArray = [],
      imageIds = [];
    for (const entityId in entityHash) {
      const entity = entityHash[entityId];

      imageIds.push(entity.posterImageId);

      if (!entity.urlTemplate) {
        continue;
      }

      let pathPrefix = null;

      if (entityKind == 'images') {
        pathPrefix = coreConstants.S3_USER_IMAGES_FOLDER;
      } else {
        pathPrefix = coreConstants.S3_USER_VIDEOS_FOLDER;
      }

      const resolutions = entity.resolutions,
        urlTemplate = entity.urlTemplate.match(/\/.*/g)[0];

      let entityKeyPattern = '/' + pathPrefix + entity.urlTemplate.match(/\/.-*/g)[0];

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
   * Invalidate cdn cache
   * @returns {Promise<void>}
   * @private
   */
  async _invalidateCdnCache() {
    const oThis = this;
    const promiseArray = [];

    for (let ind = 0; ind < oThis.entityKeys.length; ind++) {
      const path = oThis.entityKeys[ind];
      promiseArray.push(cloudfrontWrapper.invalidateCache([path]));
    }

    await Promise.all(promiseArray);
  }
}

new PerformPostVideoDeleteTasks()
  .perform()
  .then(function(resp) {
    logger.win('====Performed CDN invalidation and s3 permission change successfully====');
    process.exit(0);
  })
  .catch(function(err) {
    logger.error(err);
    process.exit(0);
  });
