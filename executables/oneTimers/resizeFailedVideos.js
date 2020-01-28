const rootPrefix = '../..',
  VideoModel = require(rootPrefix + '/app/models/mysql/Video'),
  VideoDetailModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  videoConstants = require(rootPrefix + '/lib/globalConstant/video');

class ResizeVideos {
  /**
   * Perform.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis._getVideosAndPerformOperations();
  }

  /**
   * Get video whose compression was failed.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _getVideosAndPerformOperations() {
    const oThis = this;

    const limit = 10;

    let moreDataPresent = true;

    while (moreDataPresent) {
      const dbRows = await new VideoModel()
        .select(['id'])
        .limit(limit)
        .where([
          'compression_status = ? OR poster_image_id IS NULL',
          videoConstants.invertedCompressionStatuses[videoConstants.compressionFailedStatus]
        ])
        .order_by('id DESC')
        .fire();

      if (dbRows.length === 0) {
        moreDataPresent = false;
      } else {
        let idsArray = [];

        for (let i = 0; i < dbRows.length; i++) {
          idsArray.push(dbRows[i].id);
        }
        logger.log('Failed Videos: ', idsArray);
        await oThis._getVideoDetails(idsArray);
        await basicHelper.sleep(30000);
      }
    }
  }

  /**
   * Get video details.
   *
   * @param idsArray
   * @returns {Promise<void>}
   * @private
   */
  async _getVideoDetails(idsArray) {
    const oThis = this;

    const videoDetailsDbRow = await new VideoDetailModel()
      .select('*')
      .where(['video_id in (?)', idsArray])
      .fire();

    let videoIdUserIdArray = [];
    for (let i = 0; i < videoDetailsDbRow.length; i++) {
      let detailsMap = {};
      detailsMap.userId = videoDetailsDbRow[i].creator_user_id;
      detailsMap.videoId = videoDetailsDbRow[i].video_id;
      videoIdUserIdArray.push(detailsMap);
    }

    logger.log('Video Id User Id Details Array: ', videoIdUserIdArray);
    await oThis._enqueueResizeVideoMessage(videoIdUserIdArray);
  }

  /**
   * Enqueue resize video message.
   *
   * @param dataArray
   * @returns {Promise<void>}
   * @private
   */
  async _enqueueResizeVideoMessage(dataArray) {
    const oThis = this;

    let promiseArray = [];

    for (let i = 0; i < dataArray.length; i++) {
      let params = {};
      params.userId = dataArray[i].userId;
      params.videoId = dataArray[i].videoId;

      promiseArray.push(bgJob.enqueue(bgJobConstants.videoResizer, params));
    }
    await Promise.all(promiseArray);
  }
}

new ResizeVideos()
  .perform()
  .then(function() {
    logger.win('All uncompressed failed videos compressed successfully.');
    process.exit(0);
  })
  .catch(function(err) {
    logger.error('Compression retry failed. Error: ', err);
    process.exit(1);
  });
