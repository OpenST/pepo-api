require('https').globalAgent.keepAlive = true;

const AWS = require('aws-sdk'),
  instanceMap = {};

const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  s3UploadConstants = require(rootPrefix + '/lib/globalConstant/s3Upload');

AWS.config.httpOptions.keepAlive = true;
AWS.config.httpOptions.disableProgressEvents = false;

class S3Wrapper {
  constructor() {}

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
   * @param {string} mediaKind
   * @param {string} fileName
   * @param {string} contentType
   * @param {string} region
   *
   * @returns {Promise<*>}
   */
  async createPresignedPostFor(mediaKind, fileName, contentType, region) {
    const oThis = this;

    const AWSS3 = oThis._getS3Instance(region);

    let _bucket = oThis._bucket(mediaKind),
      _key = oThis._key(mediaKind, fileName),
      _contentType = contentType,
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
        ['content-length-range', oThis._minContentLength(mediaKind), oThis._maxContentLength(mediaKind)]
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
          // logger.log('The post data is: ', presignedPostResponse);
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
   * Get s3 instance.
   *
   * @param region
   * @returns {*}
   */
  _getS3Instance(region) {
    const instanceKey = `${coreConstants.S3_AWS_ACCESS_KEY}-${region}`;

    if (!instanceMap[instanceKey]) {
      instanceMap[instanceKey] = new AWS.S3({
        accessKeyId: coreConstants.S3_AWS_ACCESS_KEY,
        secretAccessKey: coreConstants.S3_AWS_SECRET_KEY,
        region: region
      });
    }

    return instanceMap[instanceKey];
  }

  /**
   * Get s3 bucket.
   *
   * @param mediaKind
   *
   * @return {*}
   * @private
   */
  _bucket(mediaKind) {
    if (mediaKind === s3UploadConstants.imageFileType) {
      return coreConstants.S3_USER_ASSETS_BUCKET;
    } else if (mediaKind === s3UploadConstants.videoFileType) {
      return coreConstants.S3_USER_ASSETS_BUCKET;
    } else {
      throw new Error('unrecognized media kind');
    }
  }

  /**
   * Key / path of the file.
   *
   * @param mediaKind
   * @param fileName
   *
   * @return {string}
   * @private
   */
  _key(mediaKind, fileName) {
    if (mediaKind === s3UploadConstants.imageFileType) {
      return coreConstants.S3_USER_PROFILE_IMAGES + '/' + fileName;
    } else if (mediaKind === s3UploadConstants.videoFileType) {
      return coreConstants.S3_USER_VIDEOS + '/' + fileName;
    } else {
      throw new Error('unrecognized kind');
    }
  }

  /**
   * Get min content length.
   *
   * @param mediaKind
   * @returns {number}
   * @private
   */
  _minContentLength(mediaKind) {
    if (mediaKind === s3UploadConstants.imageFileType) {
      return 1024;
    } else if (mediaKind === s3UploadConstants.videoFileType) {
      return 1024;
    } else {
      throw new Error('Unrecognized media kind.');
    }
  }

  /**
   * Get max content length.
   *
   * @param mediaKind
   * @returns {number}
   * @private
   */
  _maxContentLength(mediaKind) {
    if (mediaKind === s3UploadConstants.videoFileType) {
      return 83886080; // 80 Mb
    } else if (mediaKind === s3UploadConstants.imageFileType) {
      return 10485760; // 10 Mb
    } else {
      throw new Error('Unrecognized media kind.');
    }
  }
}

module.exports = new S3Wrapper();
