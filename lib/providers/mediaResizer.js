const AWS = require('aws-sdk');

const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

// Declare variables.
const instanceMap = {};

/**
 * Class to make API calls to Pepo Resizer.
 *
 * @class MediaResizer
 */
class MediaResizer {
  /**
   * Resize image.
   *
   * @param {object} requestData
   *
   * @returns {Promise<*>}
   */
  resizeImage(requestData) {
    const oThis = this;

    Object.assign(requestData, { resource: 'resize-image' });

    return oThis._invokeLambdaRequest(coreConstants.PA_PR_IMAGE_RESIZE_FUNCTION, requestData);
  }

  /**
   * Compress video.
   *
   * @param {object} requestData
   *
   * @returns {Promise<result>}
   */
  compressVideo(requestData) {
    const oThis = this;

    Object.assign(requestData, { resource: 'compress-video' });

    return oThis._invokeLambdaRequest(coreConstants.PA_PR_VIDEO_COMPRESS_FUNCTION, requestData);
  }

  /**
   * Extract video thumbnail.
   *
   * @param {object} requestData
   *
   * @returns {Promise<result>}
   */
  extractVideoThumbnail(requestData) {
    const oThis = this;

    Object.assign(requestData, { resource: 'extract-video-thumbnail' });

    return oThis._invokeLambdaRequest(coreConstants.PA_PR_VIDEO_COMPRESS_FUNCTION, requestData);
  }

  /**
   * Merge video segments.
   *
   * @param {object}  requestData
   *
   * @returns {Promise<result>}
   */
  mergeVideoSegments(requestData) {
    const oThis = this;

    Object.assign(requestData, { resource: 'merge-video-segments' });

    return oThis._invokeLambdaRequest(coreConstants.PA_PR_VIDEO_MERGE_FUNCTION, requestData);
  }

  /**
   * Invoke lambda request.
   *
   * @param {string} functionName
   * @param {object} requestData
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _invokeLambdaRequest(functionName, requestData) {
    const oThis = this;

    const AWSLambda = oThis._getLambdaInstance(coreConstants.AWS_REGION),
      lambdaParams = { FunctionName: functionName, Payload: JSON.stringify(requestData), InvocationType: 'Event' };

    const resp = await AWSLambda.invoke(lambdaParams).promise();

    if (resp.StatusCode.toString() === '202') {
      return responseHelper.successWithData({});
    }

    return responseHelper.error({
      internal_error_identifier: 'l_mr_1',
      api_error_identifier: 'resize_request_enqueue_failed',
      debug_options: ''
    });
  }

  /**
   * Get AWS Lambda instance.
   *
   * @param {string} region
   *
   * @returns {*}
   * @private
   */
  _getLambdaInstance(region) {
    const instanceKey = `${coreConstants.AWS_ACCESS_KEY}-${region}`;

    if (!instanceMap[instanceKey]) {
      instanceMap[instanceKey] = new AWS.Lambda({
        accessKeyId: coreConstants.AWS_ACCESS_KEY,
        secretAccessKey: coreConstants.AWS_SECRET_KEY,
        region: region
      });
    }

    return instanceMap[instanceKey];
  }
}

module.exports = new MediaResizer();
