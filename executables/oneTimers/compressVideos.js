const rootPrefix = '../..',
  VideoModel = require(rootPrefix + '/app/models/mysql/Video'),
  CompressVideoLib = require(rootPrefix + '/lib/jobs/bg/resize/sendRequest/Video'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  videoConstants = require(rootPrefix + '/lib/globalConstant/video');

const isQualityChanged = process.argv[2] || false;

class CompressVideos {
  /**
   * Perform.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    logger.log('isQualityChanged: ', isQualityChanged);

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

    const limit = 1;

    let moreDataPresent = true;

    while (moreDataPresent) {
      const dbRows = await new VideoModel()
        .select(['id'])
        .limit(limit)
        .where([
          'compression_status = ?',
          videoConstants.invertedCompressionStatuses[videoConstants.notCompressedStatus]
        ])
        .order_by('id DESC')
        .fire();

      if (dbRows.length === 0) {
        moreDataPresent = false;
      } else {
        await oThis._compress(dbRows);
      }
    }
  }

  /**
   * Compress video rows.
   *
   * @param {array} videoRows
   *
   * @returns {Promise<void>}
   * @private
   */
  async _compress(videoRows) {
    const promiseArray = [];

    for (let index = 0; index < videoRows.length; index++) {
      await new CompressVideoLib({
        videoId: videoRows[index].id,
        resizeAll: isQualityChanged
      }).perform();
    }

    await Promise.all(promiseArray);
  }
}

new CompressVideos()
  .perform()
  .then(function() {
    logger.win('All videos compressed successfully.');
    process.exit(0);
  })
  .catch(function(err) {
    logger.error('Video compression failed. Error: ', err);
    process.exit(1);
  });
