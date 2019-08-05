const rootPrefix = '../..',
  ResizeBase = require(rootPrefix + '/lib/resize/Base'),
  ImageModel = require(rootPrefix + '/app/models/mysql/Image'),
  ImageByIds = require(rootPrefix + '/lib/cacheManagement/multi/ImageByIds'),
  util = require(rootPrefix + '/lib/util'),
  imageLib = require(rootPrefix + '/lib/imageLib'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
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
   * @param {boolean} [params.resizeAll]
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.imageId = params.imageId;
    oThis.resizeAll = params.resizeAll || false;

    oThis.resizeData = {};
    oThis.image = {};
  }

  /**
   * Fetch entity.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchEntity() {
    const oThis = this;

    const imageResponse = await new ImageByIds({ ids: [oThis.imageId] }).fetch();
    if (imageResponse.isFailure()) {
      return Promise.reject(responseHelper.error(imageResponse));
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

    // Mark entity as resize started.
    await oThis._updateStatus(imageConstants.resizeStarted);

    oThis._prepareUrlTemplate();
  }

  /**
   * Update entity.
   *
   * @param {string} status
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateEntity(status) {
    const oThis = this;

    await new ImageModel().updateImage({
      status: status,
      urlTemplate: oThis.image.urlTemplate,
      resolutions: oThis.image.resolutions,
      id: oThis.imageId
    });

    await ImageModel.flushCache({ id: oThis.imageId });
  }

  /**
   * Prepare request data for resizer.
   *
   * @sets oThis.resizeData
   *
   * @returns {Promise<void>}
   * @private
   */
  async _prepareResizerRequestData() {
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
    const extension = util.getFileExtension(oThis.resizeData.source_url);
    const contentType = util.getImageContentTypeForExtension(extension);

    for (const sizeName in sizesToGenerate) {
      const sizeDetails = sizesToGenerate[sizeName];
      oThis.resizeData.resize_details[sizeName] = oThis._setResizeDetails(
        sizeName,
        sizeDetails,
        contentType,
        oThis.image.urlTemplate,
        coreConstants.S3_USER_IMAGES_FOLDER
      );
    }
  }

  /**
   * Send request to resizer and mark in DB.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _sendResizerRequest() {
    const oThis = this;

    if (basicHelper.isEmptyObject(oThis.resizeData.resize_details)) {
      await oThis._updateStatus(imageConstants.resizeDone);

      return responseHelper.successWithData({});
    }

    const resizedResponse = await mediaResizer.resizeImage(oThis.resizeData);
    logger.log('--------resizedResponse------', resizedResponse);
    let status = null;
    if (resizedResponse.isSuccess()) {
      const resizedResolutions = resizedResponse.data,
        resolutionsHash = oThis.currentResolutions;

      // Since we need to shorten all the existing urls.
      for (const resolution in resolutionsHash) {
        const longUrl = resolutionsHash[resolution].url,
          params = {};

        if (longUrl.match(imageConstants.twitterImageUrlPrefix[0])) {
          params.isExternalUrl = true;
          params.imageUrl = longUrl;

          const shortenedUrl = imageLib.shortenUrl(params);
          if (shortenedUrl.isFailure()) {
            return Promise.reject(responseHelper.error(shortenedUrl));
          }
          resolutionsHash[resolution].url = shortenedUrl.data.shortUrl;
        }
      }

      // As we will not be adding resized url in db. Thus we are not shortening them.
      Object.assign(resolutionsHash, resizedResolutions);
      oThis.image.resolutions = resolutionsHash;
      status = imageConstants.resizeDone;
      await oThis._updateEntity(status);
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

    await oThis._updateStatus(imageConstants.resizeFailed);
  }

  /**
   * This function only updates the status.
   *
   * @param status
   * @returns {Promise<void>}
   * @private
   */
  async _updateStatus(status) {
    const oThis = this;

    await new ImageModel()
      .update({ status: imageConstants.invertedStatuses[status] })
      .where({ id: oThis.imageId })
      .fire();

    await ImageModel.flushCache({ id: oThis.imageId });
  }

  /**
   * Prepares url template only if url template is not present.
   *
   * @private
   */
  _prepareUrlTemplate() {
    const oThis = this;

    if (!oThis.image.urlTemplate) {
      let imageUrl = oThis.image.resolutions.original.url,
        fileExtension = util.getFileExtension(imageUrl);
      if (imageUrl.match(imageConstants.twitterImageUrlPrefix[0])) {
        oThis.image.urlTemplate =
          s3Constants.imageShortUrlPrefix +
          '/' +
          util.getS3FileTemplatePrefix(oThis.userId) +
          s3Constants.fileNameShortSizeSuffix +
          fileExtension;
      } else {
        let splitUrlArray = imageUrl.split('/'),
          fileName = splitUrlArray.pop(),
          structuredFileName = fileName.split('-');
        oThis.image.urlTemplate =
          s3Constants.imageShortUrlPrefix +
          '/' +
          structuredFileName[0] +
          '-' +
          structuredFileName[1] +
          '-' +
          s3Constants.fileNameShortSizeSuffix +
          fileExtension;
      }
    }
  }
}

module.exports = ResizeImage;
