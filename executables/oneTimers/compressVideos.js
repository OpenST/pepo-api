const rootPrefix = '../..',
  CompressVideoLib = require(rootPrefix + '/lib/resize/Video'),
  VideoModel = require(rootPrefix + '/app/models/mysql/Video'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

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

    const limit = 10;

    let page = 1,
      offset = null,
      moreDataPresent = true;

    while (moreDataPresent) {
      offset = (page - 1) * limit;

      const dbRows = await new VideoModel()
        .select(['id'])
        .limit(limit)
        .offset(offset)
        .order_by('id ASC')
        .fire();

      if (dbRows.length === 0) {
        moreDataPresent = false;
      } else {
        await oThis._compress(dbRows);
      }
      page++;
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
      promiseArray.push(
        new CompressVideoLib({ userId: 1000, videoId: videoRows[index].id, resizeAll: isQualityChanged }).perform()
      );
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
