const rootPrefix = '../..',
  VideoModel = require(rootPrefix + '/app/models/mysql/TempVideo'),
  util = require(rootPrefix + '/lib/util'),
  s3Constants = require(rootPrefix + '/lib/globalConstant/s3'),
  videoConstants = require(rootPrefix + '/lib/globalConstant/video'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

const isQualityChanged = process.argv[2] || false;

class BackPopulateVideos {
  /**
   * Perform.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    logger.log('isQualityChanged ', isQualityChanged);

    await oThis._getVideos();
  }

  /**
   * Get videos.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _getVideos() {
    const oThis = this;

    const limit = 10;

    let page = 1,
      offset = null,
      moreDataPresent = true;

    while (moreDataPresent) {
      offset = (page - 1) * limit;

      const dbRows = await new VideoModel()
        .select('*')
        .limit(limit)
        .offset(offset)
        .fire();

      if (dbRows.length === 0) {
        moreDataPresent = false;
      } else {
        await oThis._populateInNewFormat(dbRows);
      }
      page++;
    }
  }

  /**
   * Populate in new format.
   *
   * @param {array} videoRows
   *
   * @returns {Promise<void>}
   * @private
   */
  async _populateInNewFormat(videoRows) {
    const oThis = this;

    const promiseArray = [];

    for (let index = 0; index < videoRows.length; index++) {
      promiseArray.push(oThis._updateResolutionInNewFormat(videoRows[index]));
    }

    await Promise.all(promiseArray);
  }

  /**
   * Update resolution in new format in table.
   *
   * @param {object} dbRow
   *
   * @returns {Promise<{}>}
   * @private
   */
  async _updateResolutionInNewFormat(dbRow) {
    logger.log('=====dbRow====', dbRow);

    const resolutions = JSON.parse(dbRow.resolutions);
    let urlTemplate = null;

    for (const resolution in resolutions) {
      if (resolution === 'o') {
        const url = resolutions[resolution].u,
          splitUrlArray = url.split('/'),
          fileName = splitUrlArray.pop(),
          structuredFileName = fileName.split('-'),
          userId = structuredFileName[0];

        const fileExtension = util.getFileExtension(resolutions.o.u);
        urlTemplate =
          s3Constants.videoShortUrlPrefix +
          '/' +
          util.getS3FileTemplatePrefix(userId) +
          s3Constants.fileNameShortSizeSuffix +
          fileExtension;
      }
    }

    logger.log('====urlTemplate===', urlTemplate);

    const paramsToUpdate = {
      urlTemplate: urlTemplate,
      resolutions: { o: resolutions },
      compressionStatus: videoConstants.notCompressedStatus,
      id: dbRow.id
    };

    await new VideoModel().updateVideo(paramsToUpdate);
    await VideoModel.flushCache(paramsToUpdate);
  }
}

new BackPopulateVideos()
  .perform()
  .then(function() {
    logger.win('All video rows back-populated successfully.');
    process.exit(0);
  })
  .catch(function(err) {
    logger.error('Error in back-populating. Error: ', err);
    process.exit(1);
  });
