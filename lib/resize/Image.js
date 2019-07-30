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
  imageResizer = require(rootPrefix + '/lib/providers/imageResizer'),
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
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.userId = params.userId;
    oThis.imageId = params.imageId;

    oThis.resizeData = {};
    oThis.currentResolutions = null;
    oThis.image = null;
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

    console.log('--imageResponse--', imageResponse);
    oThis.image = imageResponse.data[oThis.imageId];
    console.log('-oThis.image--', oThis.image);

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

    const sourceUrl = oThis._getSourceUrl(),
      bucket = s3Constants.bucket(s3Constants.imageFileType);

    oThis.resizeData = {
      source_url: sourceUrl,
      upload_details: {
        bucket: bucket,
        acl: oThis._getAcl(),
        region: oThis._getRegion()
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

    const resizedResponse = await imageResizer.resizeImage(oThis.resizeData);
    logger.log('--------resizedResponse=====--', resizedResponse);

    if (resizedResponse.isSuccess()) {
      const resizedResolutions = resizedResponse.data,
        resolutionsHash = oThis.currentResolutions;

      //Since we need to shorten all the existing urls.
      logger.log('-resolutionsHash----', resolutionsHash);

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

      //As we will not be adding resized url in db. Thus we are not shortening them.
      Object.assign(resolutionsHash, resizedResolutions);

      await new ImageModel().updateImage({
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
   * Get source URL.
   *
   * @sets oThis.currentResolutions, oThis.originalResolution
   *
   * @returns {Promise<*>}
   * @private
   */
  _getSourceUrl() {
    const oThis = this;

    const resolutions = oThis.image.resolutions;

    if (!resolutions) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_r_i_2',
          api_error_identifier: 'something_went_wrong',
          debug_options: { resolutions: resolutions }
        })
      );
    }
    oThis.currentResolutions = resolutions;
    logger.log('oThis.currentResolutions', oThis.currentResolutions);

    oThis.originalResolution = oThis.currentResolutions.original;
    logger.log('oThis.originalResolution', oThis.originalResolution);

    if (!oThis.originalResolution) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_r_i_3',
          api_error_identifier: 'something_went_wrong',
          debug_options: { resolutions: oThis.currentResolutions }
        })
      );
    }

    return oThis.originalResolution.url;
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

    // Don't send to resize if already present in current resolution.
    if (oThis.currentResolutions[sizeName] && oThis.currentResolutions[sizeName].width) {
      return {};
    }

    if (sizeDetails.width) {
      // Don't send to resize if asking width is grater than original width.
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

    const fileName = util.gets3FileName(oThis.userId, sizeName),
      completeFileName = shortToLongUrl.getCompleteFileName(oThis.image.urlTemplate, sizeName);

    resizeDetails.file_path = coreConstants.S3_USER_IMAGES_FOLDER + '/' + completeFileName;
    resizeDetails.s3_url = shortToLongUrl.getFullUrlInternal(oThis.image.urlTemplate, sizeName);

    oThis.resizeData.resize_details[sizeName] = resizeDetails;

    return {};
  }

  /**
   * Mark image resize failed.
   *
   * @returns {Promise<*>}
   */
  async markMediaResizeFailed() {
    const oThis = this;

    return new ImageModel()
      .update({ status: imageConstants.invertedStatuses[imageConstants.resizeFailed] })
      .where({ id: oThis.imageId })
      .fire();

    await ImageModel.flushCache({ id: oThis.imageId });
  }

  /**
   * Get access control list.
   *
   * @returns {string}
   * @private
   */
  _getAcl() {
    return 'public-read';
  }

  /**
   * Get AWS region.
   *
   * @returns {string}
   * @private
   */
  _getRegion() {
    return 'us-east-1';
  }
}

module.exports = ResizeImage;
