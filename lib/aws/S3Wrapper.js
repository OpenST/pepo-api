require('https').globalAgent.keepAlive = true;

const AWS = require('aws-sdk'),
  instanceMap = {};

const fs = require('fs');

const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  s3Constants = require(rootPrefix + '/lib/globalConstant/s3'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  imageConstants = require(rootPrefix + '/lib/globalConstant/image'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

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
   * @param {object} options
   *
   * @returns {Promise<*>}
   */
  async createPresignedPostFor(mediaKind, fileName, contentType, region, options = {}) {
    const oThis = this;

    const AWSS3 = oThis._getS3Instance(region);

    const _bucket = s3Constants.bucket(mediaKind, options),
      _key = oThis._key(mediaKind, fileName, options),
      _contentType = contentType,
      _cacheControl = 'public, max-age=315360000',
      _acl = s3Constants.publicReadAcl,
      _disposition = 'inline';

    const params = {
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
        ['content-length-range', oThis._minContentLength(mediaKind), oThis._maxContentLength(mediaKind, options)]
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

    const _fields = presignedPostResponse.fields;

    _fields['Content-Type'] = _contentType;
    _fields['Cache-Control'] = _cacheControl;
    _fields.acl = _acl;
    _fields['Content-disposition'] = _disposition;

    return presignedPostResponse;
  }

  /**
   * Check file exists on s3
   *
   * @param fileName
   * @param mediaKind
   * @param [options]
   * @returns {Promise<PromiseResult<S3.HeadObjectOutput, AWSError>>}
   */
  checkFileExists(fileName, mediaKind, options) {
    const oThis = this;
    const AWSS3 = oThis._getS3Instance(coreConstants.AWS_REGION);
    const params = { Bucket: s3Constants.bucket(mediaKind, options), Key: oThis._key(mediaKind, fileName, options) };
    return new Promise(function(onResolve, onReject) {
      console.log('params-------', JSON.stringify(params));
      AWSS3.headObject(params)
        .promise()
        .then(function(resp) {
          onResolve(responseHelper.successWithData(resp));
        })
        .catch(function(err) {
          console.log('err-------', err);
          onResolve(
            responseHelper.error({
              internal_error_identifier: 'l_s3w_1',
              api_error_identifier: 'invalid_params',
              debug_options: ''
            })
          );
        });
    });
  }

  /**
   * Check file exists on s3
   *
   * @param fileName
   * @param mediaKind
   * @param [options]
   * @returns {Promise<PromiseResult<S3.HeadObjectOutput, AWSError>>}
   */
  putObject(bucket, key, FILEPATH) {
    const oThis = this;
    const AWSS3 = oThis._getS3Instance(coreConstants.AWS_REGION);

    const params = {
      Bucket: bucket,
      Key: key,
      ACL: s3Constants.publicReadAcl,
      Body: fs.createReadStream(FILEPATH)
    };

    return new Promise(function(onResolve, onReject) {
      console.log('params-------', JSON.stringify(params));
      AWSS3.putObject(params)
        .promise()
        .then(function(resp) {
          onResolve(responseHelper.successWithData(resp));
        })
        .catch(function(err) {
          console.log('err-------', err);
          onResolve(
            responseHelper.error({
              internal_error_identifier: 'l_s3w_po_1',
              api_error_identifier: 'invalid_params',
              debug_options: params
            })
          );
        });
    });
  }

  /**
   * Check file exists on s3
   *
   * @param fileName
   * @param mediaKind
   * @returns {Promise<PromiseResult<S3.HeadObjectOutput, AWSError>>}
   */
  getSignedUrl(fileName, mediaKind, urlExpiry) {
    const oThis = this;
    const AWSS3 = oThis._getS3Instance(coreConstants.AWS_REGION);
    const params = { Bucket: s3Constants.bucket(mediaKind), Key: oThis._key(mediaKind, fileName), Expires: urlExpiry };
    return AWSS3.getSignedUrl('getObject', params);
  }

  /**
   * Download file from s3 to disk
   *
   * @param bucket
   * @param key
   * @param downloadPath
   * @returns {Promise}
   */
  downloadObjectToDisk(bucket, key, downloadPath) {
    const oThis = this;

    fs.closeSync(fs.openSync(downloadPath, 'w'));
    const file = fs.createWriteStream(downloadPath);

    const AWSS3 = oThis._getS3Instance(coreConstants.AWS_REGION);
    const params = { Bucket: bucket, Key: key };

    return new Promise(function(onResolve, onReject) {
      AWSS3.getObject(params, function(err, res) {
        if (err == null) {
          file.write(res.Body, function(error) {
            if (error) {
              const errObj = responseHelper.error({
                internal_error_identifier: 'l_s3w_2',
                api_error_identifier: 'something_went_wrong',
                debug_options: { err: error }
              });

              onReject(errObj);
            }

            file.end();
            onResolve(responseHelper.successWithData({}));
          });
        } else {
          const errObj = responseHelper.error({
            internal_error_identifier: 'l_s3w_3',
            api_error_identifier: 'something_went_wrong',
            debug_options: ''
          });

          onReject(errObj);
        }
      });
    });
  }

  /**
   * Change s3 object permissions
   * @param bucket
   * @param key
   * @param permission
   * @returns {Promise}
   */
  changeObjectPermissions(bucket, key, permission) {
    const oThis = this;

    const AWSS3 = oThis._getS3Instance(coreConstants.AWS_REGION);
    const params = { Bucket: bucket, Key: key, ACL: permission };

    return new Promise(function(onResolve, onReject) {
      AWSS3.putObjectAcl(params, function(err, data) {
        if (err == null) {
          onResolve(responseHelper.successWithData({ data: data }));
        } else {
          logger.error(err);
          const errObj = responseHelper.error({
            internal_error_identifier: 'l_s3w_4',
            api_error_identifier: 'something_went_wrong',
            debug_options: ''
          });

          onReject(errObj);
        }
      });
    });
  }

  /**
   * Get s3 instance.
   *
   * @param region
   * @returns {*}
   */
  _getS3Instance(region) {
    const instanceKey = `${coreConstants.AWS_ACCESS_KEY}-${region}`;

    if (!instanceMap[instanceKey]) {
      instanceMap[instanceKey] = new AWS.S3({
        accessKeyId: coreConstants.AWS_ACCESS_KEY,
        secretAccessKey: coreConstants.AWS_SECRET_KEY,
        region: region
      });
    }

    return instanceMap[instanceKey];
  }

  /**
   * Key / path of the file.
   *
   * @param mediaKind
   * @param fileName
   * @param [options]
   *
   * @return {string}
   * @private
   */
  _key(mediaKind, fileName, options) {
    options = options || {};

    if (mediaKind === s3Constants.imageFileType) {
      if (
        options.imageKind &&
        (options.imageKind === imageConstants.channelImageKind ||
          options.imageKind === imageConstants.channelShareImageKind)
      ) {
        return coreConstants.S3_CHANNEL_IMAGES_FOLDER + '/' + fileName;
      }

      return coreConstants.S3_USER_IMAGES_FOLDER + '/' + fileName;
    } else if (mediaKind === s3Constants.videoFileType) {
      return coreConstants.S3_USER_VIDEOS_FOLDER + '/' + fileName;
    } else if (mediaKind === s3Constants.textFileType) {
      return coreConstants.S3_LOGS_FOLDER + '/' + fileName;
    }
    throw new Error('unrecognized kind');
  }

  /**
   * Get min content length.
   *
   * @param {string} mediaKind
   *
   * @returns {number}
   * @private
   */
  _minContentLength(mediaKind) {
    if (mediaKind === s3Constants.imageFileType) {
      return 1024;
    } else if (mediaKind === s3Constants.videoFileType) {
      return 1024;
    }
    throw new Error('Unrecognized media kind.');
  }

  /**
   * Get max content length.
   *
   * @param {string} mediaKind
   * @param {object} [options]
   *
   * @returns {number}
   * @private
   */
  _maxContentLength(mediaKind, options = {}) {
    if (mediaKind === s3Constants.videoFileType) {
      return 83886080; // 80 Mb
    } else if (mediaKind === s3Constants.imageFileType) {
      if (
        options.imageKind &&
        (options.imageKind === imageConstants.channelImageKind ||
          options.imageKind === imageConstants.channelShareImageKind)
      ) {
        return 3145728; // 3Mb
      }

      return 10485760; // 10 Mb
    }
    throw new Error('Unrecognized media kind.');
  }
}

module.exports = new S3Wrapper();
