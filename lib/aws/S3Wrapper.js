require('https').globalAgent.keepAlive = true;

const AWS = require('aws-sdk');

const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

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
   * @param mediaKind
   * @param fileName
   */
  constructor(mediaKind, fileName, contentType) {
    const oThis = this;

    oThis.mediaKind = mediaKind;
    oThis.fileName = fileName;
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
   * Create presigned post
   *
   * @return {S3.PresignedPost}
   */
  createPresignedPostFor() {
    const oThis = this;

    let _bucket = oThis._bucket,
      _key = oThis._key,
      _contentType = 'image/jpeg',
      _cacheControl = 'public, max-age=315360000',
      _acl = 'public-read',
      _disposition = 'inline';

    let params = {
      Bucket: _bucket,
      Expires: 3600,
      Conditions: [
        { bucket: _bucket },
        { acl: _acl },
        { 'Content-Type': _contentType },
        { 'Content-Disposition': _disposition },
        { key: _key },
        { 'Cache-Control': _cacheControl },
        { 'x-amz-algorithm': 'AWS4-HMAC-SHA256' },
        // TODO - remove hardcoding
        ['content-length-range', 1024, 10485760] // min 1KB and max 10MB
      ],
      Fields: {
        key: _key
      }
    };

    let presignedPostResponse = AWSS3.createPresignedPost(params);

    let _fields = presignedPostResponse.fields;

    _fields['Content-Type'] = _contentType;
    _fields['Cache-Control'] = _cacheControl;
    _fields['acl'] = _acl;
    _fields['Content-disposition'] = _disposition;

    return presignedPostResponse;
  }

  /**
   * Bucket
   *
   * @return {*}
   * @private
   */
  get _bucket() {
    const oThis = this;

    if (oThis.mediaKind === 'profileImage') {
      return coreConstants.S3_USER_ASSETS_BUCKET;
    } else {
      throw new Error('unrecognized media kind');
    }
  }

  /**
   * Key / path of the file
   *
   * @return {string}
   * @private
   */
  get _key() {
    const oThis = this;

    if (oThis.mediaKind === 'profileImage') {
      return coreConstants.S3_USER_PROFILE_IMAGES + '/' + oThis.fileName;
    } else {
      throw new Error('unrecognized kind');
    }
  }
}

module.exports = S3Wrapper;
