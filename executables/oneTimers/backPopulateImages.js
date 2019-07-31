const rootPrefix = '../..',
  ImageModel = require(rootPrefix + '/app/models/mysql/Image'),
  util = require(rootPrefix + '/lib/util'),
  s3Constants = require(rootPrefix + '/lib/globalConstant/s3'),
  ResizeImageLib = require(rootPrefix + '/lib/resize/Image'),
  imageConst = require(rootPrefix + '/lib/globalConstant/image'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  coreConstants = require(rootPrefix + '/config/coreConstants');

const isQualityChanged = process.argv[2] || false;

class BackPopulateImages {
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
   * Resize image rows
   *
   * @param imageRows
   * @returns {Promise<void>}
   * @private
   */
  async _populateInNewFormat(imageRows) {
    const oThis = this;

    let promiseArray = [];

    for (let index = 0; index < imageRows.length; index++) {
      promiseArray.push(oThis._updateResolutionInNewFormat(imageRows[index]));
    }

    await Promise.all(promiseArray);
  }

  async _updateResolutionInNewFormat(dbRow) {
    const oThis = this;

    //Not back-populating those rows whose url template is present.
    if (dbRow.url_template) {
      return {};
    }

    let resolutions = JSON.parse(dbRow.resolutions),
      urlTemplate = null;

    for (let resolution in resolutions) {
      if (resolution !== 'original') {
        let url = resolutions[resolution].url,
          splitUrlArray = url.split('/'),
          fileName = splitUrlArray.pop(),
          structuredFileName = fileName.split('-'),
          userId = structuredFileName[0];

        let fileExtension = util.getFileExtension(resolutions.original.url);
        urlTemplate =
          s3Constants.imageShortUrlPrefix +
          '/' +
          util.getS3FileTemplatePrefix(userId) +
          s3Constants.fileNameShortSizeSuffix +
          fileExtension;
      }
    }

    let paramsToUpdate = {
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
  .then(function(rsp) {
    process.exit(0);
  })
  .catch(function(err) {
    console.log(err);
    process.exit(1);
  });
