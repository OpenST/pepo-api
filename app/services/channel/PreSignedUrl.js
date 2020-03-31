const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  AwsS3wrapper = require(rootPrefix + '/lib/aws/S3Wrapper'),
  util = require(rootPrefix + '/lib/util'),
  s3Constants = require(rootPrefix + '/lib/globalConstant/s3'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  imageConstants = require(rootPrefix + '/lib/globalConstant/image'),
  adminEntityType = require(rootPrefix + '/lib/globalConstant/adminEntityType');

/**
 * Class to get pre-signed url.
 *
 * @class PreSignedUrl
 */
class PreSignedUrl extends ServiceBase {
  /**
   * Constructor to get pre-signed url.
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor() {
    super();

    const oThis = this;

    oThis.fileExtension = '.jpeg';

    oThis.workingMap = {};
    oThis.apiResponse = {};
  }

  /**
   * Async perform.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    const contentType = 'image/jpeg';

    const channelOriginalFileName = oThis._getRandomEncodedFileNames('original'),
      channelShareFileName = oThis._getRandomEncodedFileNames('share-original');

    const resultHash = {},
      intent = s3Constants.imageFileType,
      fileArray = [channelOriginalFileName, channelShareFileName],
      resultKey = s3Constants.imagesResultKey;

    for (let index = 0; index < fileArray.length; index++) {
      const fileName = fileArray[index];

      const preSignedPostParams = await AwsS3wrapper.createPresignedPostFor(
        intent,
        fileName,
        contentType,
        coreConstants.AWS_REGION,
        { imageKind: imageConstants.channelImageKind }
      );

      const s3Url = oThis._getS3UrlForChannel(fileName);

      resultHash[fileName] = {
        postUrl: preSignedPostParams.url,
        postFields: preSignedPostParams.fields,
        s3Url: s3Url
      };
    }

    oThis.apiResponse[resultKey] = resultHash;

    return responseHelper.successWithData({ [adminEntityType.channelUploadParamsMap]: oThis.apiResponse });
  }

  /**
   * Get s3 url for channel.
   *
   * @param {string} fileName
   * @returns {string}
   * @private
   */
  _getS3UrlForChannel(fileName) {
    return s3Constants.getS3UrlPrefix() + '/' + coreConstants.S3_CHANNEL_IMAGES_FOLDER + '/' + fileName;
  }

  /**
   * Get random encoded file names.
   *
   * @returns {string}
   * @private
   */
  _getRandomEncodedFileNames(fileSuffix) {
    const oThis = this;

    const version = new Date().getTime() + '-' + Math.floor(Math.random() * 100000000);

    return util.createMd5Digest(version) + '-' + fileSuffix + oThis.fileExtension;
  }
}

module.exports = PreSignedUrl;
