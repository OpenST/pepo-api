const rootPrefix = '../..',
  ResizeBase = require(rootPrefix + '/lib/resize/Base'),
  ImageModel = require(rootPrefix + '/app/models/mysql/Image'),
  ImageByIds = require(rootPrefix + '/lib/cacheManagement/multi/ImageByIds'),
  util = require(rootPrefix + '/lib/util'),
  imageLib = require(rootPrefix + '/lib/imageLib'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  shortToLongUrl = require(rootPrefix + '/lib/shortToLongUrl'),
  s3Constants = require(rootPrefix + '/lib/globalConstant/s3'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  imageConstants = require(rootPrefix + '/lib/globalConstant/image'),
  mediaResizer = require(rootPrefix + '/lib/providers/mediaResizer'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs');

/**
 * Class to resize image.
 *
 * @class ResizeImage
 */
class ResizeImage extends ResizeBase {
  /**
   * Constructor to resize image.
   *
   * @param {object} params
   * @param {number} params.userId
   * @param {number} params.imageId
   * @param {boolean} params.resizeAll
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.userId = params.userId;
    oThis.imageId = params.imageId;
    oThis.resizeAll = params.resizeAll || false;

    oThis.resizeData = {};
    oThis.image = {};
  }

  /**
   * Async performer.
   *
   * @returns {Promise<*>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._getImageData();

    await oThis._prepareResizeRequestData();

    logger.log('------oThis.resizeData----------', oThis.resizeData);

    return oThis._resizeImages();
  }

  /**
   * Get image data.
   *
   * @sets oThis.image
   *
   * @returns {Promise<*>}
   * @private
   */
  async _getImageData() {
    const oThis = this;

    const imageResponse = await new ImageByIds({ ids: [oThis.imageId] }).fetch();

    if (imageResponse.isFailure()) {
      return Promise.reject(imageResponse);
    }

    oThis.image = imageResponse.data[oThis.imageId];

    if (!oThis.image || oThis.image.status === imageConstants.resizeStarted) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_r_i_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { imageId: oThis.imageId }
        })
      );
    }

    await new ImageModel()
      .update({ status: imageConstants.invertedStatuses[imageConstants.resizeStarted] })
      .where({ id: oThis.imageId })
      .fire();

    await ImageModel.flushCache({ id: oThis.imageId });

    if (!oThis.image.urlTemplate) {
      let fileExtension = util.getFileExtension(oThis.image.resolutions.original.url);
      oThis.image.urlTemplate =
        s3Constants.imageShortUrlPrefix +
        '/' +
        util.getS3FileTemplatePrefix(oThis.userId) +
        s3Constants.fileNameShortSizeSuffix +
        fileExtension;
    }
    return responseHelper.successWithData({});
  }

  /**
   * Prepare resize request data.
   *
   * @sets oThis.resizeData
   *
   * @returns {Promise<void>}
   * @private
   */
  async _prepareResizeRequestData() {
    const oThis = this;

    const sourceUrl = await oThis.getSourceUrl(oThis.image.resolutions),
      bucket = s3Constants.bucket(s3Constants.imageFileType);

    oThis.resizeData = {
      source_url: sourceUrl,
      upload_details: {
        bucket: bucket,
        acl: oThis.getAcl(),
        region: oThis.getRegion()
      },
      resize_details: {}
    };

    const resizeImageKind = oThis.image.kind;
    const sizesToGenerate = imageConstants.resizeSizes[resizeImageKind];

    for (const sizeName in sizesToGenerate) {
      const sizeDetails = sizesToGenerate[sizeName];
      oThis._setResizeDetails(sizeName, sizeDetails);
    }
  }

  /**
   * Set resize details.
   *
   * @param {string} sizeName
   * @param {object} sizeDetails
   *
   * @returns {{}}
   * @private
   */
  _setResizeDetails(sizeName, sizeDetails) {
    const oThis = this;

    const extension = util.getFileExtension(oThis.resizeData.source_url),
      resizeDetails = {};

    //if resize all flag is set then following check is not performed.
    if (!oThis.resizeAll) {
      // Don't send to resize if already present in current resolution.
      if (oThis.currentResolutions[sizeName] && oThis.currentResolutions[sizeName].width) {
        return {};
      }
    }

    if (sizeDetails.width) {
      // Don't send to resize if asking width is greater than original width.
      if (oThis.originalResolution.width && oThis.originalResolution.width <= sizeDetails.width) {
        return {};
      }
      resizeDetails.width = sizeDetails.width;
    }
    if (sizeDetails.height) {
      // Don't send to resize if asking height is grater than original height.
      if (oThis.originalResolution.height && oThis.originalResolution.height <= sizeDetails.height) {
        return {};
      }
      resizeDetails.height = sizeDetails.height;
    }
    resizeDetails.content_type = util.getImageContentTypeForExtension(extension);

    const completeFileName = shortToLongUrl.getCompleteFileName(oThis.image.urlTemplate, sizeName);

    resizeDetails.file_path = coreConstants.S3_USER_IMAGES_FOLDER + '/' + completeFileName;
    resizeDetails.s3_url = shortToLongUrl.getFullUrlInternal(oThis.image.urlTemplate, sizeName);

    oThis.resizeData.resize_details[sizeName] = resizeDetails;

    return {};
  }

  /**
   * Resize images.
   *
   * @returns {Promise<result>}
   * @private
   */
  async _resizeImages() {
    const oThis = this;

    if (basicHelper.isEmptyObject(oThis.resizeData.resize_details)) {
      await new ImageModel()
        .update({
          status: imageConstants.invertedStatuses[imageConstants.resizeDone]
        })
        .where({ id: oThis.imageId })
        .fire();

      await ImageModel.flushCache({ id: oThis.imageId });

      return responseHelper.successWithData({});
    }

    const resizedResponse = await mediaResizer.resizeImage(oThis.resizeData);
    logger.log('--------resizedResponse------', resizedResponse);

    if (resizedResponse.isSuccess()) {
      const resizedResolutions = resizedResponse.data,
        resolutionsHash = oThis.currentResolutions;

      // Since we need to shorten all the existing urls.
      for (const resolution in resolutionsHash) {
        const longUrl = resolutionsHash[resolution].url,
          params = {};

        if (longUrl.match(imageConstants.twitterImageUrlPrefix[0])) {
          params.isExternalUrl = true;
        }
        params.imageUrl = longUrl;

        const shortenedUrl = imageLib.shortenUrl(params);
        if (shortenedUrl.isFailure()) {
          return Promise.reject(shortenedUrl);
        }
        resolutionsHash[resolution].url = shortenedUrl.data.shortUrl;
      }

      // As we will not be adding resized url in db. Thus we are not shortening them.
      Object.assign(resolutionsHash, resizedResolutions);

      await new ImageModel().updateImage({
        urlTemplate: oThis.image.urlTemplate,
        status: imageConstants.resizeDone,
        resolutions: resolutionsHash,
        id: oThis.imageId
      });

      await ImageModel.flushCache({ id: oThis.imageId });
    } else {
      await oThis.markMediaResizeFailed();
      await createErrorLogsEntry.perform(resizedResponse, errorLogsConstants.mediumSeverity);
    }

    return responseHelper.successWithData({});
  }

  /**
   * Mark image resize failed.
   *
   * @returns {Promise<*>}
   */
  async markMediaResizeFailed() {
    const oThis = this;

    await new ImageModel()
      .update({ status: imageConstants.invertedStatuses[imageConstants.resizeFailed] })
      .where({ id: oThis.imageId })
      .fire();

    return ImageModel.flushCache({ id: oThis.imageId });
  }
}

module.exports = ResizeImage;
