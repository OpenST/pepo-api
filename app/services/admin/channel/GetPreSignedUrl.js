const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  AwsS3wrapper = require(rootPrefix + '/lib/aws/S3Wrapper'),
  util = require(rootPrefix + '/lib/util'),
  s3Constants = require(rootPrefix + '/lib/globalConstant/s3'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class to get pre-signed url.
 *
 * @class GetPreSignedUrl
 */
class GetPreSignedUrl extends ServiceBase {
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

    const channelOriginalFileName = oThis._getRandomEncodedFileNames(),
      channelShareOriginalFileName = oThis._getRandomEncodedFileNames();

    const resultHash = {},
      intent = s3Constants.imageFileType,
      fileArray = [channelOriginalFileName, channelShareOriginalFileName],
      resultKey = s3Constants.imagesResultKey;

    for (let index = 0; index < fileArray.length; index++) {
      const fileName = fileArray[index];

      const preSignedPostParams = await AwsS3wrapper.createPresignedPostFor(
        intent,
        fileName,
        contentType,
        coreConstants.AWS_REGION
      );

      const s3Url = oThis._getS3UrlForChannel(fileName);

      resultHash[fileName] = {
        postUrl: preSignedPostParams.url,
        postFields: preSignedPostParams.fields,
        s3Url: s3Url
      };
    }

    oThis.apiResponse[resultKey] = resultHash;

    return responseHelper.successWithData({ uploadParamsMap: oThis.apiResponse });
  }

  /**
   * Get s3 url for channel.
   *
   * @param {string} fileName
   * @returns {string}
   * @private
   */
  _getS3UrlForChannel(fileName) {
    const oThis = this;

    return s3Constants.getS3UrlPrefix() + '/' + coreConstants.S3_CHANNEL_IMAGES_FOLDER + '/' + fileName;
  }

  /**
   * Get random encoded file names.
   *
   * @returns {string}
   * @private
   */
  _getRandomEncodedFileNames() {
    const oThis = this;

    const version = new Date().getTime() + '-' + Math.floor(Math.random() * 100000000);

    return util.createMd5Digest(version) + '-' + oThis.fileExtension;
  }
}

module.exports = GetPreSignedUrl;
