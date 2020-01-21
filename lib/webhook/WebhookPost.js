const crypto = require('crypto'),
  https = require('https'),
  http = require('http'),
  url = require('url');

const rootPrefix = '../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

// Declare variables.
const API_SIGNATURE_KIND = 'PEPO-WEBHOOK-HMAC-SHA256';

/**
 * Sign query params.
 *
 * @param {object} queryParams
 * @param {object} _apiCredentials
 * @param {object} queryHeaders
 *
 * @returns {string}
 */
function _signQueryParams(queryParams, _apiCredentials, queryHeaders) {
  const api_signature = [];

  for (let index = 0; index < _apiCredentials.secrets.length; index++) {
    const secret = _apiCredentials.secrets[index];
    const buff = new Buffer.from(secret, 'utf8');
    const hmac = crypto.createHmac('sha256', buff);

    hmac.update(`${queryHeaders['pepo-timestamp']}.${queryHeaders['pepo-version']}.${queryParams}`);
    api_signature.push(hmac.digest('hex'));
  }

  return api_signature.join(',');
}

/**
 * Class for webhook post.
 *
 * @param {object} params
 * @param {array<string>} params.webhookSecrets: array of webhook secrets
 * @param {string} params.apiEndpoint: complete specific api endpoint
 * @param {string} params.apiVersion: API version
 * @param {object} params.config: configurations like timeout
 *
 * @class WebhookPost
 */
class WebhookPost {
  /**
   * Constructor for webhook post.
   *
   * @param {object} params
   * @param {array<string>} params.webhookSecrets: array of webhook secrets.
   * @param {string} params.apiEndpoint: complete specific api endpoint.
   * @param {string} params.apiVersion: API version.
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    const _apiCredentials = {};

    // Validate webhook secrets.
    if (CommonValidators.validateAlphaNumericStringArray(params.webhookSecrets)) {
      _apiCredentials.secrets = params.webhookSecrets;
    } else {
      throw new Error('Webhook secrets not present.');
    }

    oThis.apiEndpoint = params.apiEndpoint.replace(/\/$/, '');
    oThis.timeOut = 60000; // 60 seconds.
    oThis.requestHeaders = {
      'pepo-timestamp': parseInt(Math.round(new Date().getTime() / 1000)),
      'api-signature-kind': API_SIGNATURE_KIND,
      'pepo-version': params.apiVersion,
      'Content-Type': 'application/json'
    };

    /**
     * Sign request.
     *
     * @param {object} queryParams
     *
     * @private
     */
    oThis._signRequest = function(queryParams) {
      oThis.requestHeaders['pepo-signature'] = _signQueryParams(queryParams, _apiCredentials, oThis.requestHeaders);
    };
  }

  /**
   * Class to send a post request.
   *
   * @param {object} queryParams
   *
   * @returns {*|Promise<unknown>}
   */
  post(queryParams) {
    const oThis = this;

    return oThis._send('POST', queryParams);
  }

  /**
   * Sign request.
   *
   * @private
   */
  _signRequest() {
    /**
     Note: This is just an empty function body.
     The actual code has been moved to constructor.
     Modifying this method will not have any impact.
     **/
  }

  /**
   * Send request.
   *
   * @param {string} requestType - API request type
   * @param {object} queryParams - resource query parameters
   *
   * @private
   */
  _send(requestType, queryParams) {
    const oThis = this;

    const parsedURL = url.parse(oThis.apiEndpoint);

    queryParams = JSON.stringify(queryParams);
    oThis._signRequest(queryParams);

    const options = {
      host: parsedURL.hostname,
      port: parsedURL.port,
      path: parsedURL.path,
      method: requestType,
      json: true,
      headers: oThis.requestHeaders
    };

    return new Promise(function(onResolve, onReject) {
      let chunkedResponseData = '';

      const request = (parsedURL.protocol === 'https:' ? https : http).request(options, function(response) {
        response.setEncoding('utf8');

        response.on('data', function(chunk) {
          chunkedResponseData += chunk;
        });

        response.on('end', function() {
          const parsedResponse = oThis._parseResponse(chunkedResponseData, response);
          onResolve(parsedResponse);
        });
      });

      request.on('socket', function(socket) {
        socket.setTimeout(oThis.timeOut);
        socket.on('timeout', function() {
          // eslint-disable-next-line prefer-promise-reject-errors
          onReject({
            success: false,
            err: { code: 'GATEWAY_TIMEOUT', internal_id: 'TIMEOUT_ERROR', msg: '', error_data: [] }
          });
        });
      });

      request.on('error', function(err) {
        logger.error('Mappy request error.');
        logger.error(err);
        const parsedResponse = oThis._parseResponse(err);
        onResolve(parsedResponse);
      });

      // Write data to server.
      if (requestType === 'POST' && CommonValidators.validateString(queryParams)) {
        request.write(queryParams);
      }
      request.end();
    });
  }

  /**
   * Parse response.
   *
   * @param {string} responseData: response data
   * @param {object} [httpResponse]: HTTP response object
   *
   * @returns {*|result}
   * @private
   */
  _parseResponse(responseData, httpResponse) {
    const statusCode = (httpResponse || {}).statusCode,
      regEx = /^2[0-9]{2}/;

    if (statusCode && statusCode.toString().length === 3 && statusCode.toString().match(regEx)) {
      return responseHelper.successWithData(responseData || {});
    }

    let parsedResponse = '';

    try {
      parsedResponse = JSON.parse(responseData);
    } catch (err) {
      logger.error('Error while parsing error response: ', err);
      parsedResponse = responseData;
    }

    return responseHelper.error({
      internal_error_identifier: 'l_wp_1',
      api_error_identifier: 'something_went_wrong',
      debug_options: { httpStatusCode: statusCode, errorData: parsedResponse }
    });
  }
}

module.exports = WebhookPost;
