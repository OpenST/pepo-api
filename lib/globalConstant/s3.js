class S3 {
  /**
   * Constructor for S3.
   *
   * @constructor
   */
  constructor() {}

  get LongUrlToShortUrlMap() {
    return {
      'https://uassets.stagingpepo.com.s3.amazonaws.com/d/ua/images': 's3_ui',
      'https://uassets.stagingpepo.com.s3.amazonaws.com/d/ua/videos': 's3_vi'
    };
  }
}

module.exports = new S3();
