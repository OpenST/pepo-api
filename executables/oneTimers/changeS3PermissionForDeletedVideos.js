/**
 * One time to populate transactions data.
 *
 * Usage: node executables/oneTimers/changeS3PermissionForDeletedVideos.js
 *
 * @module executables/oneTimers/changeS3PermissionForDeletedVideos
 */
const command = require('commander');

const rootPrefix = '../..',
  s3Wrapper = require(rootPrefix + '/lib/aws/S3Wrapper'),
  shortToLongUrl = require(rootPrefix + '/lib/shortToLongUrl'),
  s3Constants = require(rootPrefix + '/lib/globalConstant/s3'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  videoConstants = require(rootPrefix + '/lib/globalConstant/video'),
  VideoModel = require(rootPrefix + '/app/models/mysql/Video'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

const BATCH_SIZE = 25,
  pathPrefix = coreConstants.S3_USER_VIDEOS_FOLDER;

command
  .version('0.1.0')
  .usage('[options]')
  .option('-f, --videoId <videoId>', 'id of the videos table')
  .parse(process.argv);

/**
 * class for populate transactions data
 *
 * @class ChangeS3PermissionForDeletedVideos
 */
class ChangeS3PermissionForDeletedVideos {
  /**
   * constructor to populate transactions data
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.totalRowsFound = null;
    oThis.videoIdToStart = null;
    oThis.videoId = null;
    oThis.userId = null;
    oThis.video = null;
    oThis.notProcessedVideoIds = [];
  }

  /**
   * Perform
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis._performBatch();
  }

  /**
   * Perform batch
   *
   * @returns {Promise<void>}
   * @private
   */
  async _performBatch() {
    const oThis = this;

    oThis.videoIdToStart = command.videoId ? command.videoId : 0;

    let limit = BATCH_SIZE,
      offset = 0;
    while (true) {
      await oThis._fetchVideos(limit, offset);
      // No more records present to migrate
      if (oThis.totalRowsFound === 0) {
        break;
      }

      offset = offset + BATCH_SIZE;
    }
  }

  /**
   * Fetch transaction
   *
   * @param limit
   * @param offset
   * @returns {Promise<void>}
   * @private
   */
  async _fetchVideos(limit, offset) {
    const oThis = this;

    let videosData = await new VideoModel()
      .select('*')
      .where([
        'id > (?) AND status = ? AND resolutions like (?)',
        oThis.videoIdToStart,
        videoConstants.invertedStatuses[videoConstants.deletedStatus],
        '%"e"%'
      ])
      .order_by('id asc')
      .limit(limit)
      .offset(offset)
      .fire();

    oThis.totalRowsFound = videosData.length;

    if (oThis.totalRowsFound == 0) {
      return;
    }

    let promiseArray = [];
    for (let index = 0; index < videosData.length; index++) {
      let formatDbRow = new VideoModel()._formatDbData(videosData[index]);
      const bucket = coreConstants.S3_USER_ASSETS_BUCKET,
        fileName = shortToLongUrl.getCompleteFileName(formatDbRow.urlTemplate, videoConstants.externalResolution),
        entityKey = s3Wrapper._key(s3Constants.videoFileType, fileName);

      console.log('entityKey===', entityKey);
      promiseArray.push(s3Wrapper.changeObjectPermissions(bucket, entityKey, s3Constants.privateAcl));
    }

    await Promise.all(promiseArray);
  }
}

new ChangeS3PermissionForDeletedVideos({})
  .perform()
  .then(function(rsp) {
    logger.log('Completed Successfully!!!');
    process.exit(0);
  })
  .catch(function(err) {
    logger.log(err);
    process.exit(1);
  });
