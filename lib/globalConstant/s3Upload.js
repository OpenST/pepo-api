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
}

module.exports = new S3Upload();
