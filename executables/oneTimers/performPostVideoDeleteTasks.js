/*
 *
 * Usage: node executables/oneTimers/performPostVideoDeleteTasks.js
 */

const rootPrefix = '../..',
  VideoModel = require(rootPrefix + '/app/models/mysql/Video'),
  ImageModel = require(rootPrefix + '/app/models/mysql/Image'),
  s3Wrapper = require(rootPrefix + '/lib/aws/S3Wrapper'),
  imageConstants = require(rootPrefix + '/lib/globalConstant/image'),
  videoConstants = require(rootPrefix + '/lib/globalConstant/video'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  s3Constants = require(rootPrefix + '/lib/globalConstant/s3'),
  shortToLongUrl = require(rootPrefix + '/lib/shortToLongUrl'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob'),
  cdnCacheInvalidationEnqueue = require(rootPrefix + '/lib/rabbitMqEnqueue/cdnCacheInvalidation'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

const BATCH_SIZE = 10;
const IMAGE_BATCH_SIZE = 10;

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

    await oThis._enqueueClearCdnCache();
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

    let promiseArray = [];

    while (Rows.length > 0) {
      offset = (pageNo - 1) * BATCH_SIZE;
      Rows = await new VideoModel()
        .select('id, url_template, poster_image_id, resolutions')
        .where({ status: videoConstants.invertedStatuses[videoConstants.deletedStatus] })
        .limit(BATCH_SIZE)
        .offset(offset)
        .fire();

      pageNo += 1;

      promiseArray = [];
      for (let ind = 0; ind < Rows.length; ind++) {
        const formattedData = new VideoModel()._formatDbData(Rows[ind]);

        if (formattedData.posterImageId) {
          oThis.imageIds.push(formattedData.posterImageId);
        }
        promiseArray.push(oThis._changePermissionsForAllResolutions(formattedData, 'videos'));
        await Promise.all(promiseArray);
      }
    }
  }

  /**
   * Change s3 permissions for images
   * @returns {Promise<void>}
   * @private
   */
  async _changeS3PermissionsForImages() {
    const oThis = this;

    let promiseArray = [];
    while (oThis.imageIds.length > 0) {
      const imageIds = oThis.imageIds.splice(0, IMAGE_BATCH_SIZE);

      const Rows = await new ImageModel()
        .select('id, url_template, resolutions')
        .where({ id: imageIds })
        .fire();

      promiseArray = [];
      for (let ind = 0; ind < Rows.length; ind++) {
        const formattedData = new ImageModel()._formatDbData(Rows[ind]);
        promiseArray.push(oThis._changePermissionsForAllResolutions(formattedData, 'images'));
      }
      await Promise.all(promiseArray);
    }
  }

  /**
   * Change permissions for all resolutions of an entity
   * @param entity
   * @param entityKind
   * @returns {Promise<void>}
   * @private
   */
  async _changePermissionsForAllResolutions(entity, entityKind) {
    const oThis = this;

    const promiseArray = [];

    if (!entity.urlTemplate) {
      return;
    }

    let pathPrefix = null,
      sizeMap = null;

    if (entityKind == 'images') {
      pathPrefix = coreConstants.S3_USER_IMAGES_FOLDER;
      sizeMap = imageConstants.invertedResolutionKeyToShortMap;
    } else {
      pathPrefix = coreConstants.S3_USER_VIDEOS_FOLDER;
      sizeMap = videoConstants.invertedResolutionKeyToShortMap;
    }

    const resolutions = entity.resolutions,
      urlTemplate = entity.urlTemplate.match(/\/.*/g)[0];

    let entityKeyPattern = '/' + pathPrefix + entity.urlTemplate.match(/\/.*-/g)[0];

    entityKeyPattern += '*'; // Select all with this pattern
    oThis.entityKeys.push(entityKeyPattern);

    for (const size in resolutions) {
      const sizeParsed = sizeMap[size];

      const bucket = coreConstants.S3_USER_ASSETS_BUCKET,
        entityKey = pathPrefix + shortToLongUrl.replaceSizeInUrlTemplate(urlTemplate, sizeParsed);
      promiseArray.push(
        s3Wrapper.changeObjectPermissions(bucket, entityKey, s3Constants.privateAcl).catch(function(err) {
          logger.error('===Error for', entityKey);
        })
      );
    }

    await Promise.all(promiseArray);
  }

  /**
   * Clear cdn cache for deleted video and poster image
   *
   * @returns {Promise<void>}
   * @private
   */
  async _enqueueClearCdnCache() {
    const oThis = this;

    const promiseArray = [];

    for (let ind = 0; ind < oThis.entityKeys.length; ind++) {
      const path = oThis.entityKeys[ind];
      const enqueueParams = {
        pathArray: [path]
      };
      promiseArray.push(cdnCacheInvalidationEnqueue.enqueue(bgJobConstants.cdnCacheInvalidationTopic, enqueueParams));
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
