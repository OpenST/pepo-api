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

  get imagesResultKey() {
    return 'images';
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

  get LongUrlToShortUrlMap() {
    const oThis = this;

    return {
      [oThis.getS3UrlPrefix() + '/' + coreConstants.S3_USER_IMAGES_FOLDER]: oThis.imageShortUrlPrefix,
      [oThis.getS3UrlPrefix() + '/' + coreConstants.S3_USER_IMAGES_FOLDER]: oThis.imageShortUrlPrefix,
      [coreConstants.PA_CDN_URL() + '/' + coreConstants.S3_USER_IMAGES_FOLDER]: oThis.imageShortUrlPrefix,
      [coreConstants.PA_CDN_URL() + '/' + coreConstants.S3_USER_VIDEOS_FOLDER]: oThis.videoShortUrlPrefix,
      [imageConstants.twitterImagePrefix]: imageConstants.twitterShortImagePrefix
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

  get videoShortUrlPrefix() {
    return '{{s3_vi}}';
  }

  get fileNameShortSizeSuffix() {
    return '{{s}}';
  }

  /**
   * Get s3 bucket.
   *
   * @param mediaKind
   *
   * @return {*}
   * @private
   */
  bucket(mediaKind) {
    const oThis = this;

    if (mediaKind === oThis.imageFileType) {
      return coreConstants.S3_USER_ASSETS_BUCKET;
    } else if (mediaKind === oThis.videoFileType) {
      return coreConstants.S3_USER_ASSETS_BUCKET;
    }
    throw new Error('unrecognized media kind');
  }

  /**
   * Get s3 url.
   *
   * @param {string} intent
   * @param {string} fileName
   *
   * @private
   */
  getS3Url(intent, fileName) {
    const oThis = this;

    switch (intent) {
      case oThis.imageFileType:
        return oThis.getS3UrlPrefix() + '/' + coreConstants.S3_USER_IMAGES_FOLDER + '/' + fileName;

      case oThis.videoFileType:
        return oThis.getS3UrlPrefix() + '/' + coreConstants.S3_USER_VIDEOS_FOLDER + '/' + fileName;

      default:
        throw new Error('Unsupported file type.');
    }
  }
}

module.exports = new S3();
