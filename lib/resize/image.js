const rootPrefix = '../..',
  ImageModel = require(rootPrefix + '/app/models/mysql/Image'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  s3Constants = require(rootPrefix + '/lib/globalConstant/s3'),
  util = require(rootPrefix + '/lib/util'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  ImageConstants = require(rootPrefix + '/lib/globalConstant/image'),
  imageResizer = require(rootPrefix + '/lib/providers/imageResizer');

class ResizeImage {
  constructor(params) {
    const oThis = this;
    oThis.userId = params.userId;
    oThis.imageId = params.imageId;
    oThis.generateOriginal = params.generateOriginal || 0;

    oThis.resizeData = {};
    oThis.currentResolutions = null;
    oThis.image = null;
  }

  async perform() {
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

    if (!oThis.image) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_r_i_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { imageId: oThis.imageId }
        })
      );
    }

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
      if (oThis.currentResolutions[sizeName] && oThis.currentResolutions[sizeName].width) {
        continue;
      }
      let resizeDetails = oThis._getResizeDetails(sizeName, sizeDetails);
      oThis.resizeData.resize_details[sizeName] = resizeDetails;
    }
  }

  async _resizeImages() {
    const oThis = this;

    if (basicHelper.isEmptyObject(oThis.resizeData.resize_details)) {
      return responseHelper.successWithData({});
    }

    let resizedData = await imageResizer.resizeImage(oThis.resizeData);

    console.log('---------------resizedData----------', resizedData);
    if (resizedData.isSuccess()) {
      let resizedResolutions = resizedData.data;
      if (!basicHelper.isEmptyObject(resizedResolutions)) {
        Object.assign(oThis.currentResolutions, resizedResolutions);
        await new ImageModel()
          .update({ resolutions: JSON.stringify(oThis.currentResolutions) })
          .where({ id: oThis.imageId })
          .fire();
      }
    }

    console.log(oThis.currentResolutions);

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

    if (!oThis.currentResolutions.original || !oThis.currentResolutions.original.url) {
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

  _getResizeDetails(sizeName, sizeDetails) {
    const oThis = this,
      extension = util.getFileExtension(oThis.resizeData.source_url),
      resizeDetails = {};

    if (sizeDetails.width) {
      resizeDetails.width = sizeDetails.width;
    }
    if (sizeDetails.height) {
      resizeDetails.height = sizeDetails.height;
    }
    resizeDetails.content_type = util.getImageContentTypeForExtension(extension);

    let fileName = util.gets3FileName(oThis.userId, sizeName),
      completeFileName = fileName + extension,
      file_path = coreConstants.S3_USER_IMAGES_FOLDER + '/' + completeFileName;

    resizeDetails.file_path = file_path;
    resizeDetails.s3_url = s3Constants.getS3Url(s3Constants.imageFileType, completeFileName);

    return resizeDetails;
  }

  _getAcl() {
    return 'public-read';
  }

  _getRegion() {
    return 'us-east-1';
  }
}

module.exports = ResizeImage;
