const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  util = require(rootPrefix + '/lib/util');

let shortToLongUrlMap = null;

class S3 {
  /**
   * Constructor for S3.
   *
   * @constructor
   */
  constructor() {}

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
      [oThis.getS3UrlPrefix() + '/' + coreConstants.S3_USER_IMAGES_FOLDER]: '{{s3_ui}}',
      [oThis.getS3UrlPrefix() + '/' + coreConstants.S3_USER_VIDEOS_FOLDER]: '{{s3_vi}}'
    };
  }

  get shortToLongUrl() {
    const oThis = this;

    if (!shortToLongUrlMap) {
      shortToLongUrlMap = util.invert(oThis.LongUrlToShortUrlMap);
    }

    return shortToLongUrlMap;
  }

  convertToLongUrl(url) {
    const oThis = this;

    for (let shortHand in oThis.shortToLongUrl) {
      url = url.replace(shortHand, oThis.shortToLongUrl[shortHand]);
    }

    return url;
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
    } else {
      throw new Error('unrecognized media kind');
    }
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
