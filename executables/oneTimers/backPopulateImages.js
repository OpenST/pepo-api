const rootPrefix = '../..',
  ImageModel = require(rootPrefix + '/app/models/mysql/Image'),
  util = require(rootPrefix + '/lib/util'),
  s3Constants = require(rootPrefix + '/lib/globalConstant/s3'),
  imageConst = require(rootPrefix + '/lib/globalConstant/image'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

const isQualityChanged = process.argv[2] || false;

class BackPopulateImages {
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
   * Get images.
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
        .select('*')
        .limit(limit)
        .offset(offset)
        .order_by('id ASC')
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
   * @param {array} imageRows
   *
   * @returns {Promise<void>}
   * @private
   */
  async _populateInNewFormat(imageRows) {
    const oThis = this;

    const promiseArray = [];

    for (let index = 0; index < imageRows.length; index++) {
      promiseArray.push(oThis._updateResolutionInNewFormat(imageRows[index]));
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
    // Not back-populating those rows whose url template is present.
    if (dbRow.url_template) {
      return {};
    }

    const resolutions = JSON.parse(dbRow.resolutions);
    let urlTemplate = null;

    for (const resolution in resolutions) {
      if (resolution !== 'original') {
        const url = resolutions[resolution].url,
          splitUrlArray = url.split('/'),
          fileName = splitUrlArray.pop(),
          structuredFileName = fileName.split('-'),
          userId = structuredFileName[0];

        const fileExtension = util.getFileExtension(resolutions.original.url);
        urlTemplate =
          s3Constants.imageShortUrlPrefix +
          '/' +
          util.getS3FileTemplatePrefix(userId) +
          s3Constants.fileNameShortSizeSuffix +
          fileExtension;
      }
    }

    const paramsToUpdate = {
      urlTemplate: urlTemplate,
      resolutions: { original: resolutions.original },
      status: imageConst.statuses[dbRow.status],
      id: dbRow.id
    };

    await new ImageModel().updateImage(paramsToUpdate);
    await ImageModel.flushCache(paramsToUpdate);
  }
}

new BackPopulateImages()
  .perform()
  .then(function() {
    logger.win('All image rows back-populated successfully.');
    process.exit(0);
  })
  .catch(function(err) {
    logger.error('Error in back-populating. Error: ', err);
    process.exit(1);
  });
