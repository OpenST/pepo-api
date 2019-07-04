require('https').globalAgent.keepAlive = true;

const AWS = require('aws-sdk');

const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  s3UploadConstants = require(rootPrefix + '/lib/globalConstant/s3Upload');

AWS.config.httpOptions.keepAlive = true;
AWS.config.httpOptions.disableProgressEvents = false;

const AWSS3 = new AWS.S3({
  accessKeyId: coreConstants.S3_AWS_ACCESS_KEY,
  secretAccessKey: coreConstants.S3_AWS_SECRET_KEY,
  region: coreConstants.S3_AWS_REGION
});

class S3Wrapper {
  /**
   * Constructor
   *
   * @param {string} mediaKind
   * @param {string} fileName
   * @param {string} contentType
   */
  constructor(mediaKind, fileName, contentType) {
    const oThis = this;

    oThis.mediaKind = mediaKind;
    oThis.fileName = fileName;
    oThis.contentType = contentType;
  }

  // /**
  //  * Get signed URL for media kind and file name
  //  *
  //  * @param mediaKind
  //  * @param fileName
  //  * @return {string}
  //  */
  // getSignedUrlFor(mediaKind, fileName) {
  //   const oThis = this;
  //
  //   let params = {
  //     Bucket: oThis._bucket,
  //     Key: oThis._key,
  //     Expires: 3600,
  //     ACL: 'public-read'
  //   };
  //
  //   return AWSS3.getSignedUrl('putObject', params);
  // }

  /**
   * Create pre-signed post.
   *
   * @returns {Promise<*>}
   */
  async createPresignedPostFor() {
    const oThis = this;

    let _bucket = oThis._bucket,
      _key = oThis._key,
      _contentType = oThis.contentType,
      _cacheControl = 'public, max-age=315360000',
      _acl = 'public-read',
      _disposition = 'inline';

    let params = {
      Bucket: _bucket,
      Expires: 3600, // 1 hour
      Conditions: [
        { bucket: _bucket },
        { acl: _acl },
        { 'Content-Type': _contentType },
        { 'Content-Disposition': _disposition },
        { key: _key },
        { 'Cache-Control': _cacheControl },
        { 'x-amz-algorithm': 'AWS4-HMAC-SHA256' },
        ['content-length-range', oThis._minContentLength, oThis._maxContentLength]
      ],
      Fields: {
        key: _key
      }
    };

    let presignedPostResponse = null;

    await new Promise(function(onResolve, onReject) {
      AWSS3.createPresignedPost(params, function(err, data) {
        if (err) {
          logger.error('Pre-signing post data encountered an error: ', err);
          onReject();
        } else {
          presignedPostResponse = data;
          logger.log('The post data is: ', presignedPostResponse);
          onResolve();
        }
      });
    });

    let _fields = presignedPostResponse.fields;

    _fields['Content-Type'] = _contentType;
    _fields['Cache-Control'] = _cacheControl;
    _fields['acl'] = _acl;
    _fields['Content-disposition'] = _disposition;

    return presignedPostResponse;
  }

  /**
   * Get s3 bucket.
   *
   * @return {*}
   * @private
   */
  get _bucket() {
    const oThis = this;

    if (oThis.mediaKind === s3UploadConstants.imageFileType) {
      return coreConstants.S3_USER_ASSETS_BUCKET;
    } else if (oThis.mediaKind === s3UploadConstants.videoFileType) {
      return coreConstants.S3_USER_ASSETS_BUCKET;
    } else {
      throw new Error('unrecognized media kind');
    }
  }

  /**
   * Key / path of the file.
   *
   * @return {string}
   * @private
   */
  get _key() {
    const oThis = this;

    if (oThis.mediaKind === s3UploadConstants.imageFileType) {
      return coreConstants.S3_USER_PROFILE_IMAGES + '/' + oThis.fileName;
    } else if (oThis.mediaKind === s3UploadConstants.videoFileType) {
      return coreConstants.S3_USER_PROFILE_IMAGES + '/' + oThis.fileName;
    } else {
      throw new Error('unrecognized kind');
    }
  }

  /**
   * Get min content length.
   *
   * @private
   */
  get _minContentLength() {
    const oThis = this;

    if (oThis.mediaKind === s3UploadConstants.imageFileType) {
      return 1024;
    } else if (oThis.mediaKind === s3UploadConstants.videoFileType) {
      return 1024;
    } else {
      throw new Error('Unrecognized media kind.');
    }
  }

  /**
   * Get max content length.
   *
   * @private
   */
  get _maxContentLength() {
    const oThis = this;

    if (oThis.mediaKind === s3UploadConstants.videoFileType) {
      return 83886080; // 80 Mb
    } else if (oThis.mediaKind === s3UploadConstants.imageFileType) {
      return 10485760; // 10 Mb
    } else {
      throw new Error('Unrecognized media kind.');
    }
  }
}

module.exports = S3Wrapper;
