const rootPrefix = '../..',
  ImageModel = require(rootPrefix + '/app/models/mysql/Image'),
  ResizeImageLib = require(rootPrefix + '/lib/jobs/bg/resize/sendRequest/Image'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  imageConstants = require(rootPrefix + '/lib/globalConstant/image');

const isQualityChanged = process.argv[2] || false;

class ResizeImages {
  /**
   * Perform.
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

    const limit = 10;

    let page = 1,
      offset = null,
      moreDataPresent = true;

    while (moreDataPresent) {
      offset = (page - 1) * limit;

      const dbRows = await new ImageModel()
        .select(['id'])
        .limit(limit)
        .offset(offset)
        .where(['resize_status != ?', imageConstants.invertedResizeStatuses[imageConstants.notResized]])
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
   * Resize image rows.
   *
   * @param {array} imageRows
   *
   * @returns {Promise<void>}
   * @private
   */
  async _resize(imageRows) {
    const promiseArray = [];

    for (let index = 0; index < imageRows.length; index++) {
      promiseArray.push(new ResizeImageLib({ imageId: imageRows[index].id, resizeAll: isQualityChanged }).perform());
    }

    await Promise.all(promiseArray);
  }
}

new ResizeImages()
  .perform()
  .then(function() {
    logger.win('All images resized successfully.');
    process.exit(0);
  })
  .catch(function(err) {
    logger.error('Image resize failed. Error: ', err);
    process.exit(1);
  });
