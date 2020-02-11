const rootPrefix = '../../../../..',
  ImageModel = require(rootPrefix + '/app/models/mysql/Image'),
  ResizeBase = require(rootPrefix + '/lib/jobs/bg/resize/sendRequest/Base'),
  ImageByIds = require(rootPrefix + '/lib/cacheManagement/multi/ImageByIds'),
  util = require(rootPrefix + '/lib/util'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  s3Constants = require(rootPrefix + '/lib/globalConstant/s3'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  imageConstants = require(rootPrefix + '/lib/globalConstant/image'),
  mediaResizer = require(rootPrefix + '/lib/providers/mediaResizer'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob'),
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

    if (!oThis.image || oThis.image.resizeStatus === imageConstants.resizeStarted) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_r_i_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { imageId: oThis.imageId }
        })
      );
    }

    oThis._prepareUrlTemplate();

    // Mark entity as resize started.
    await oThis._updateEntity(imageConstants.resizeStarted);
  }

  /**
   * Update entity.
   *
   * @param {string} resizeStatus
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateEntity(resizeStatus) {
    const oThis = this;

    await new ImageModel().updateImage({
      userId: oThis.userId,
      resizeStatus: resizeStatus,
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
    let contentType = util.getImageContentTypeForExtension(extension);
    if (!contentType) {
      contentType = 'image/jpeg';
    }

    // If source url is from external source, then even save original
    if (imageConstants.isFromExternalSource(sourceUrl)) {
      sizesToGenerate[imageConstants.originalResolution] = {};
    }
    for (const sizeName in sizesToGenerate) {
      const sizeDetails = sizesToGenerate[sizeName],
        s3Folder =
          resizeImageKind === imageConstants.channelImageKind || resizeImageKind == imageConstants.channelShareImageKind
            ? coreConstants.S3_CHANNEL_IMAGES_FOLDER
            : coreConstants.S3_USER_IMAGES_FOLDER;

      oThis.resizeData.resize_details[sizeName] = oThis._setResizeDetails(
        sizeName,
        sizeDetails,
        contentType,
        oThis.image.urlTemplate,
        s3Folder
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
      await oThis._updateEntity(imageConstants.resizeDone);

      return responseHelper.successWithData({});
    }

    const resizedResponse = await mediaResizer.resizeImage(oThis.resizeData);
    if (resizedResponse.isFailure()) {
      await oThis.markMediaResizeFailed();

      return responseHelper.successWithData({});
    }

    await bgJob.enqueue(
      bgJobConstants.checkResizeProgressJobTopic,
      { userId: oThis.userId, mediaId: oThis.imageId, mediaKind: s3Constants.imageFileType, trialCount: 1 },
      { publishAfter: 10000 }
    );

    return responseHelper.successWithData({});
  }

  /**
   * Mark image resize failed.
   *
   * @returns {Promise<*>}
   */
  async markMediaResizeFailed() {
    const oThis = this;

    await oThis._updateEntity(imageConstants.resizeFailed);

    const errObject = responseHelper.error({
      internal_error_identifier: 'l_r_i_2',
      api_error_identifier: 'something_went_wrong',
      debug_options: ''
    });
    await createErrorLogsEntry.perform(errObject, errorLogsConstants.mediumSeverity);
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
        fileExtension = util.getFileExtension(imageUrl),
        contentType = util.getImageContentTypeForExtension(fileExtension);
      if (!contentType) {
        fileExtension = '.jpeg';
      }
      if (imageConstants.isFromExternalSource(imageUrl)) {
        oThis.image.urlTemplate =
          s3Constants.imageShortUrlPrefix +
          '/' +
          util.getS3FileTemplatePrefix(oThis.userId) +
          s3Constants.fileNameShortSizeSuffix +
          fileExtension;
      } else {
        const splitUrlArray = imageUrl.split('/'),
          fileName = splitUrlArray.pop();

        oThis.image.urlTemplate = oThis._getUrlTemplate(fileName, fileExtension);
      }
    }
  }

  /**
   * Get url template.
   *
   * @param fileName
   * @param fileExtension
   * @returns {*|[]|string[]}
   * @private
   */
  _getUrlTemplate(fileName, fileExtension) {
    const oThis = this;

    const structuredFileName = fileName.split('-'),
      imageKind = oThis.image.kind;

    if (imageKind === imageConstants.channelImageKind) {
      return (
        s3Constants.channelImageShortUrlPrefix +
        '/' +
        structuredFileName[0] +
        '-' +
        s3Constants.fileNameShortSizeSuffix +
        fileExtension
      );
    } else if (imageKind === imageConstants.channelShareImageKind) {
      return (
        s3Constants.channelImageShortUrlPrefix +
        '/' +
        structuredFileName[0] +
        '-' +
        structuredFileName[1] +
        '-' +
        s3Constants.fileNameShortSizeSuffix +
        fileExtension
      );
    } else {
      return (
        s3Constants.imageShortUrlPrefix +
        '/' +
        structuredFileName[0] +
        '-' +
        structuredFileName[1] +
        '-' +
        s3Constants.fileNameShortSizeSuffix +
        fileExtension
      );
    }
  }
}

module.exports = ResizeImage;
