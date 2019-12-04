require('https').globalAgent.keepAlive = true;

const AWS = require('aws-sdk'),
  instanceMap = {};

const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

AWS.config.httpOptions.keepAlive = true;
AWS.config.httpOptions.disableProgressEvents = false;

/**
 * Class for cloudfront wrapper.
 *
 * @class CloudfrontWrapper
 */
class CloudfrontWrapper {
  /**
   * Invalidate cache.
   *
   * @param {array} itemsArray
   *
   * @returns {Promise<unknown>}
   */
  invalidateCache(itemsArray) {
    const oThis = this;

    const AWSCDF = oThis._getCloudfrontInstance(coreConstants.AWS_REGION);
    const quantity = itemsArray.length;

    const params = {
      DistributionId: coreConstants.PA_CDN_DISTRIBUTION_ID,
      InvalidationBatch: {
        CallerReference: Date.now().toString(),
        Paths: {
          Quantity: quantity,
          Items: itemsArray
        }
      }
    };

    return new Promise(function(onResolve, onReject) {
      AWSCDF.createInvalidation(params, function(err, data) {
        if (err == null) {
          onResolve(responseHelper.successWithData({ data: data }));
        } else {
          logger.error(err);
          const errObj = responseHelper.error({
            internal_error_identifier: 'l_cldfw_1',
            api_error_identifier: 'something_went_wrong',
            debug_options: ''
          });

          onReject(errObj);
        }
      });
    });
  }

  /**
   * Get cloudfront instance.
   *
   * @param {string} region
   *
   * @returns {*}
   */
  _getCloudfrontInstance(region) {
    const instanceKey = `${coreConstants.AWS_ACCESS_KEY}-${region}`;

    if (!instanceMap[instanceKey]) {
      instanceMap[instanceKey] = new AWS.CloudFront({
        accessKeyId: coreConstants.AWS_ACCESS_KEY,
        secretAccessKey: coreConstants.AWS_SECRET_KEY,
        region: region
      });
    }

    return instanceMap[instanceKey];
  }
}

module.exports = new CloudfrontWrapper();
