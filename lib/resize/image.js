const rootPrefix = '../..',
  ImageModel = require(rootPrefix + '/app/models/mysql/Image'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  s3Constants = require(rootPrefix + '/lib/globalConstant/s3'),
  util = require(rootPrefix + '/lib/util'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  ImageConstants = require(rootPrefix + '/lib/globalConstant/image'),
  imageResizer = require(rootPrefix + '/lib/providers/imageResizer'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  apiVersions = require(rootPrefix + '/lib/globalConstant/apiVersions');

const errorConfig = basicHelper.fetchErrorConfig(apiVersions.v1);

class ResizeImage {
  constructor(params) {
    const oThis = this;
    oThis.userId = params.userId;
    oThis.imageId = params.imageId;

    oThis.resizeData = {};
    oThis.currentResolutions = null;
    oThis.image = null;
  }

  perform() {
    const oThis = this;

    return oThis._asyncPerform().catch(async function(err) {
      let errorObject = err;

      if (!responseHelper.isCustomResult(err)) {
        errorObject = responseHelper.error({
          internal_error_identifier: 'l_r_i_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { error: err.toString() },
          error_config: errorConfig
        });
      }
      logger.error(' In catch block of lib/resize/image', err);

      await oThis._markImageFailed().catch(logger.log);

      return errorObject;
    });
  }

  async _asyncPerform() {
    const oThis = this;

    await oThis._getImageData();

    await oThis._prepareResizeRequestData();

    console.log('------oThis.resizeData----------', oThis.resizeData);

    return oThis._resizeImages();
  }

  async _getImageData() {
    const oThis = this;

    let images = await new ImageModel()
      .select('*')
      .where({ id: oThis.imageId })
      .fire();
    oThis.image = images[0];

    if (!oThis.image || oThis.image.status == ImageConstants.invertedStatuses[ImageConstants.resizeStarted]) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_r_i_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { imageId: oThis.imageId }
        })
      );
    }

    await new ImageModel()
      .update({ status: ImageConstants.invertedStatuses[ImageConstants.resizeStarted] })
      .where({ id: oThis.imageId })
      .fire();

    return responseHelper.successWithData({});
  }

  async _prepareResizeRequestData() {
    const oThis = this;

    let sourceUrl = await oThis._getSourceUrl(),
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

    let resizeImageKind = ImageConstants.kinds[oThis.image.kind];
    let sizesToGenerate = ImageConstants.resizeSizes[resizeImageKind];

    for (let sizeName in sizesToGenerate) {
      let sizeDetails = sizesToGenerate[sizeName];
      oThis._setResizeDetails(sizeName, sizeDetails);
    }
    // Check and add original for resize data.
    if (oThis.originalResolution.externalUrl == 1) {
      oThis._setResizeDetails('original', {});
    }
  }

  async _resizeImages() {
    const oThis = this;

    if (basicHelper.isEmptyObject(oThis.resizeData.resize_details)) {
      return responseHelper.successWithData({});
    }

    let resizedResponse = await imageResizer.resizeImage(oThis.resizeData);

    if (resizedResponse.isSuccess()) {
      let resizedResolutions = resizedResponse.data;
      if (!basicHelper.isEmptyObject(resizedResolutions)) {
        Object.assign(oThis.currentResolutions, resizedResolutions);
        await new ImageModel()
          .update({
            status: ImageConstants.invertedStatuses[ImageConstants.resizeDone],
            resolutions: JSON.stringify(oThis.currentResolutions)
          })
          .where({ id: oThis.imageId })
          .fire();
      }
      console.log('---2------------oThis.currentResolutions----------', oThis.currentResolutions);
    } else {
      await oThis._markImageFailed();
      console.log('---2------------resizedResponse----------', resizedResponse);
      await createErrorLogsEntry.perform(resizedResponse, errorLogsConstants.mediumSeverity);
    }

    return responseHelper.successWithData({});
  }

  async _getSourceUrl() {
    const oThis = this;

    let resolutions = oThis.image.resolutions;

    if (!resolutions) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_r_i_2',
          api_error_identifier: 'something_went_wrong',
          debug_options: { resolutions: resolutions }
        })
      );
    }
    oThis.currentResolutions = JSON.parse(resolutions);
    oThis.originalResolution = oThis.currentResolutions.original;

    if (!oThis.originalResolution || !oThis.originalResolution.url) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_r_i_3',
          api_error_identifier: 'something_went_wrong',
          debug_options: { resolutions: oThis.currentResolutions }
        })
      );
    }

    return s3Constants.convertToLongUrl(oThis.currentResolutions.original.url);
  }

  _setResizeDetails(sizeName, sizeDetails) {
    const oThis = this,
      extension = util.getFileExtension(oThis.resizeData.source_url),
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

    let fileName = util.gets3FileName(oThis.userId, sizeName),
      completeFileName = fileName + extension,
      file_path = coreConstants.S3_USER_IMAGES_FOLDER + '/' + completeFileName;

    resizeDetails.file_path = file_path;
    resizeDetails.s3_url = s3Constants.getS3Url(s3Constants.imageFileType, completeFileName);

    oThis.resizeData.resize_details[sizeName] = resizeDetails;

    return {};
  }

  async _markImageFailed() {
    const oThis = this;

    return new ImageModel()
      .update({ status: ImageConstants.invertedStatuses[ImageConstants.resizeFailed] })
      .where({ id: oThis.imageId })
      .fire();
  }

  _getAcl() {
    return 'public-read';
  }

  _getRegion() {
    return 'us-east-1';
  }
}

module.exports = ResizeImage;
