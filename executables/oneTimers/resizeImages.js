const rootPrefix = '../..',
  ImageModel = require(rootPrefix + '/app/models/mysql/Image'),
  ResizeImageLib = require(rootPrefix + '/lib/resize/Image'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  coreConstants = require(rootPrefix + '/config/coreConstants');

const isQualityChanged = process.argv[2] || false;

class ResizeImages {
  constructor() {
    const oThis = this;
  }

  /**
   * Perform
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    logger.log('isQualityChanged ', isQualityChanged);

    await oThis._getImages();
  }

  /**
   * Get images
   *
   * @returns {Promise<void>}
   * @private
   */
  async _getImages() {
    const oThis = this;

    let page = 1,
      limit = 10,
      offset = null,
      moreDataPresent = true;

    while (moreDataPresent) {
      offset = (page - 1) * limit;

      const dbRows = await new ImageModel()
        .select(['id'])
        .limit(limit)
        .offset(offset)
        .order_by('id ASC')
        .fire();

      if (dbRows.length === 0) {
        moreDataPresent = false;
      } else {
        await oThis._resize(dbRows);
      }
      page++;
    }
  }

  /**
   * Resize image rows
   *
   * @param imageRows
   * @returns {Promise<void>}
   * @private
   */
  async _resize(imageRows) {
    const oThis = this;

    let promiseArray = [];

    for (let index = 0; index < imageRows.length; index++) {
      promiseArray.push(
        new ResizeImageLib({ userId: 1000, imageId: imageRows[index].id, resizeAll: isQualityChanged }).perform()
      );
    }

    await Promise.all(promiseArray);
  }
}

new ResizeImages()
  .perform()
  .then(function(rsp) {
    process.exit(0);
  })
  .catch(function(err) {
    console.log(err);
    process.exit(1);
  });
