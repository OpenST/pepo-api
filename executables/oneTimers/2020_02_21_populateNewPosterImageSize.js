const rootPrefix = '../..',
  ImageModel = require(rootPrefix + '/app/models/mysql/Image'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  imageConstants = require(rootPrefix + '/lib/globalConstant/image'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

class PopulateNewPosterImageSize {
  constructor() {}

  async perform() {
    const limit = 25;

    let page = 1,
      offset = null,
      moreDataPresent = true;

    while (moreDataPresent) {
      offset = (page - 1) * limit;

      const dbRows = await new ImageModel()
        .select('*')
        .where({
          kind: imageConstants.invertedKinds[imageConstants.posterImageKind],
          status: imageConstants.invertedStatuses[imageConstants.activeStatus]
        })
        .order_by('id desc')
        .limit(limit)
        .offset(offset)
        .fire();

      if (dbRows.length === 0) {
        moreDataPresent = false;
      } else {
        const promiseArray = [];

        for (let imageIndex = 0; imageIndex < dbRows.length; imageIndex++) {
          const dbRow = dbRows[imageIndex];

          logger.log('dbRow.id ====', dbRow.id);
          promiseArray.push(bgJob.enqueue(bgJobConstants.imageResizer, { imageId: dbRow.id }));
        }

        await Promise.all(promiseArray);
        await basicHelper.sleep(2000);
      }

      page++;
    }
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
