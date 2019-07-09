const rootPrefix = '../..',
  s3UploadConstants = require(rootPrefix + '/lib/globalConstant/s3Upload');

class S3 {
  /**
   * Constructor for S3.
   *
   * @constructor
   */
  constructor() {}

  get LongUrlToShortUrlMap() {
    return {
      [s3UploadConstants.getS3UrlPrefix() + '/images']: '{{s3_ui}}',
      [s3UploadConstants.getS3UrlPrefix() + '/videos']: '{{s3_vi}}'
    };
  }
}

module.exports = new S3();
