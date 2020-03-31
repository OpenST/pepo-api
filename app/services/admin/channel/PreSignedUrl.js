const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  AwsS3wrapper = require(rootPrefix + '/lib/aws/S3Wrapper'),
  util = require(rootPrefix + '/lib/util'),
  s3Constants = require(rootPrefix + '/lib/globalConstant/s3'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  imageConstants = require(rootPrefix + '/lib/globalConstant/image'),
  adminEntityType = require(rootPrefix + '/lib/globalConstant/adminEntityType');

// Declare variables.
const FILE_EXTENSION = '.jpeg';

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

    const channelOriginalFileName = oThis._getRandomEncodedFileNames('original');

    const resultHash = {},
      intent = s3Constants.imageFileType,
      resultKey = s3Constants.imagesResultKey;

    const preSignedPostParams = await AwsS3wrapper.createPresignedPostFor(
      intent,
      channelOriginalFileName,
      contentType,
      coreConstants.AWS_REGION,
      { imageKind: imageConstants.channelImageKind }
    );

    const s3Url = oThis._getS3UrlForChannel(channelOriginalFileName);

    resultHash[channelOriginalFileName] = {
      postUrl: preSignedPostParams.url,
      postFields: preSignedPostParams.fields,
      s3Url: s3Url
    };

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
   * @param {string} [fileSuffix]
   *
   * @returns {string}
   * @private
   */
  _getRandomEncodedFileNames(fileSuffix) {
    const version = new Date().getTime() + '-' + Math.floor(Math.random() * 100000000);

    return util.createMd5Digest(version) + '-' + fileSuffix + FILE_EXTENSION;
  }
}

module.exports = PreSignedUrl;
