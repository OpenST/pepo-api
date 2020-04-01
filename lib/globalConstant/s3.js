const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  imageConstants = require(rootPrefix + '/lib/globalConstant/image');

let shortToLongUrlMap = null,
  longUrlToShortUrlMap = null;

/**
 * Class for s3 constants.
 *
 * @class S3
 */
class S3 {
  get imageFileType() {
    return 'image';
  }

  get videoFileType() {
    return 'video';
  }

  get textFileType() {
    return 'text';
  }

  get imagesResultKey() {
    return 'images';
  }

  get channelImagesResultKey() {
    return 'channel_images';
  }

  get videosResultKey() {
    return 'videos';
  }

  get resultKey() {
    return 'resultKey';
  }

  get fileType() {
    return 'fileType';
  }

  get files() {
    return 'files';
  }

  get s3UrlPrefix() {
    return 'https://s3.amazonaws.com/';
  }

  /* AWS ACL valid values - Start */

  get privateAcl() {
    return 'private';
  }

  get publicReadAcl() {
    return 'public-read';
  }

  get publicReadWriteAcl() {
    return 'public-read-write';
  }

  get authenticatedReadAcl() {
    return 'authenticated-read';
  }

  get awsExecReadAcl() {
    return 'aws-exec-read';
  }

  get bucketOwnerReadAcl() {
    return 'bucket-owner-read';
  }

  get bucketOwnerFullControlAcl() {
    return 'bucket-owner-full-control';
  }

  /* AWS ACL valid values - End */

  /**
   * Get s3 url prefix.
   *
   * @returns {string}
   * @private
   */
  getS3UrlPrefix() {
    const oThis = this;

    return oThis.s3UrlPrefix + coreConstants.S3_USER_ASSETS_BUCKET;
  }

  /**
   * Get channel s3 url prefix.
   *
   * @returns {string}
   */
  getS3ChannelUrlPrefix() {
    const oThis = this;

    return oThis.s3UrlPrefix + coreConstants.S3_CHANNEL_ASSETS_BUCKET;
  }

  /**
   * Long to short url map.
   *
   * @returns {{[p: string]: string}}
   * @constructor
   */
  get LongUrlToShortUrlMap() {
    const oThis = this;

    return {
      [oThis.getS3UrlPrefix() + '/' + coreConstants.S3_USER_IMAGES_FOLDER]: oThis.imageShortUrlPrefix,
      [oThis.getS3ChannelUrlPrefix() + '/' + coreConstants.S3_CHANNEL_IMAGES_FOLDER]: oThis.channelImageShortUrlPrefix,
      [oThis.getS3UrlPrefix() + '/' + coreConstants.S3_USER_VIDEOS_FOLDER]: oThis.videoShortUrlPrefix,
      [coreConstants.PA_CDN_URL + '/' + coreConstants.S3_USER_IMAGES_FOLDER]: oThis.imageShortUrlPrefix,
      [coreConstants.PA_CDN_URL + '/' + coreConstants.S3_CHANNEL_IMAGES_FOLDER]: oThis.channelImageShortUrlPrefix,
      [coreConstants.PA_CDN_URL + '/' + coreConstants.S3_USER_VIDEOS_FOLDER]: oThis.videoShortUrlPrefix
      // ,[imageConstants.twitterImagePrefix]: imageConstants.twitterShortImagePrefix
    };
  }

  get shortToLongUrl() {
    const oThis = this;

    if (!shortToLongUrlMap) {
      shortToLongUrlMap = util.invert(oThis.LongUrlToShortUrlMap);
    }

    return shortToLongUrlMap;
  }

  get shortUrlToLongUrlMapForCdn() {
    const oThis = this;

    return {
      [oThis.imageShortUrlPrefix]: [coreConstants.PA_CDN_URL + '/' + coreConstants.S3_USER_IMAGES_FOLDER],
      [oThis.channelImageShortUrlPrefix]: [coreConstants.PA_CDN_URL + '/' + coreConstants.S3_CHANNEL_IMAGES_FOLDER],
      [oThis.videoShortUrlPrefix]: [coreConstants.PA_CDN_URL + '/' + coreConstants.S3_USER_VIDEOS_FOLDER]
    };
  }

  get longUrlToShortUrlMapForCdn() {
    const oThis = this;

    if (!longUrlToShortUrlMap) {
      longUrlToShortUrlMap = util.invert(oThis.shortUrlToLongUrlMapForCdn);
    }

    return longUrlToShortUrlMap;
  }

  shortToLongUrlForResponse(url) {
    const oThis = this;

    for (const shortHand in oThis.shortUrlToLongUrlMapForCdn) {
      url = url.replace(shortHand, oThis.shortUrlToLongUrlMapForCdn[shortHand]);
    }

    return url;
  }

  convertToLongUrl(url) {
    const oThis = this;

    for (const shortHand in oThis.shortToLongUrl) {
      url = url.replace(shortHand, oThis.shortToLongUrl[shortHand]);
    }

    return url;
  }

  get imageShortUrlPrefix() {
    return '{{s3_ui}}';
  }

  get channelImageShortUrlPrefix() {
    return '{{s3_ci}}';
  }

  get videoShortUrlPrefix() {
    return '{{s3_vi}}';
  }

  get fileNameShortSizeSuffix() {
    return '{{s}}';
  }

  /**
   * Get s3 bucket.
   *
   * @param {object} mediaKind
   * @param {object} [options]
   *
   * @return {*}
   * @private
   */
  bucket(mediaKind, options) {
    const oThis = this;

    options = options || {};

    if (mediaKind === oThis.imageFileType) {
      if (
        (options.imageKind && options.imageKind === imageConstants.channelImageKind) ||
        options.imageKind === imageConstants.channelShareImageKind
      ) {
        return coreConstants.S3_CHANNEL_ASSETS_BUCKET;
      }

      return coreConstants.S3_USER_ASSETS_BUCKET;
    } else if (mediaKind === oThis.videoFileType) {
      return coreConstants.S3_USER_ASSETS_BUCKET;
    } else if (mediaKind === oThis.textFileType) {
      return coreConstants.S3_USER_ASSETS_BUCKET;
    }
    throw new Error('Unrecognized media kind.');
  }

  /**
   * Get s3 url.
   *
   * @param {string} intent
   * @param {string} fileName
   * @param {boolean} [isChannelImage]
   *
   * @private
   */
  getS3Url(intent, fileName, isChannelImage = false) {
    const oThis = this;

    switch (intent) {
      case oThis.imageFileType: {
        const s3Bucket = isChannelImage ? coreConstants.S3_CHANNEL_IMAGES_FOLDER : coreConstants.S3_USER_IMAGES_FOLDER;

        return oThis.getS3UrlPrefix() + '/' + s3Bucket + '/' + fileName;
      }

      case oThis.videoFileType:
        return oThis.getS3UrlPrefix() + '/' + coreConstants.S3_USER_VIDEOS_FOLDER + '/' + fileName;

      default:
        throw new Error('Unsupported file type.');
    }
  }
}

module.exports = new S3();
