const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

class S3Upload {
  /**
   * Constructor for S3Upload.
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

    return oThis.s3UrlPrefix + coreConstants.S3_USER_ASSETS_BUCKET + '/' + coreConstants.S3_USER_ASSETS_FOLDER;
  }
}

module.exports = new S3Upload();
