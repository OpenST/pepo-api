const rootPrefix = '../..',
  VideoModel = require(rootPrefix + '/app/models/mysql/Video'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

class PopulateNewPosterImageSize {
  constructor() {}

  async perform() {
    const oThis = this;

    const limit = 25;

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
        await oThis._populateDataForGivenRows(dbRows);
      }
      page++;
    }
  }

  /**
   * Get video details.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _populateDataForGivenRows(dbRows) {
    const videoIds = [],
      videoIdToPosterImageDetailsMap = {},
      promiseArray = [];

    for (let videoIndex = 0; videoIndex < dbRows.length; videoIndex++) {
      const dbRow = dbRows[videoIndex];

      videoIdToPosterImageDetailsMap[dbRow.id] = {
        posterImageId: dbRow.poster_image_id
      };
      videoIds.push(dbRow.id);
    }

    const videoDetailsCacheResp = await new VideoDetailsByVideoIdsCache({ videoIds: videoIds }).fetch();

    if (videoDetailsCacheResp.isFailure()) {
      return Promise.reject(videoDetailsCacheResp);
    }

    const videoDetailsCacheRespData = videoDetailsCacheResp.data;

    for (let videoId in videoDetailsCacheRespData) {
      const creatorUserId = videoDetailsCacheRespData[videoId].creatorUserId,
        posterImageId = videoIdToPosterImageDetailsMap[videoId].posterImageId;

      videoIdToPosterImageDetailsMap[videoId].creatorUserId = creatorUserId;

      if (creatorUserId && posterImageId) {
        logger.log('====', { userId: creatorUserId, imageId: posterImageId });

        promiseArray.push(
          bgJob.enqueue(bgJobConstants.imageResizer, { userId: creatorUserId, imageId: posterImageId })
        );
      }
    }
    await Promise.all(promiseArray);
  }
}

new PopulateNewPosterImageSize()
  .perform()
  .then(function() {
    logger.win('All image rows back-populated successfully.');
    process.exit(0);
  })
  .catch(function(err) {
    logger.error('Error in back-populating. Error: ', err);
    process.exit(1);
  });
