const queryString = require('qs'),
  https = require('https'),
  http = require('http'),
  url = require('url');

const rootPrefix = '..',
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for Http Request.
 *
 * @class HttpRequest
 */
class HttpRequest {
  /**
   * Constructor for Http Request.
   *
   * @param {object} params
   * @param {string} params.resource
   * @param {object} [params.header]
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.resource = params.resource;
    oThis.header = params.header;
  }

  /**
   * Send get request.
   *
   * @param {object} [queryParams]: resource query parameters
   *
   * @public
   */
  get(queryParams = {}) {
    const oThis = this;

    return oThis._send('GET', queryParams);
  }

  /**
   * Send post request.
   *
   * @param {object} [queryParams]: resource query parameters
   *
   * @public
   */
  post(queryParams = {}) {
    const oThis = this;

    return oThis._send('POST', queryParams);
  }

  /**
   * Get parsed URL
   *
   * @param {string} resource: API Resource
   *
   * @return {object} - parsed url object
   * @private
   */
  _parseURL(resource) {
    return url.parse(resource);
  }

  /**
   * Send request.
   *
   * @param {string} requestType: API request type
   * @param {object} queryParams: resource query parameters
   *
   * @returns {Promise<*>}
   * @private
   */
  async _send(requestType, queryParams) {
    const oThis = this;

    const parsedURL = oThis._parseURL(oThis.resource),
      requestData = oThis.formatQueryParams(queryParams);

    const options = {
      host: parsedURL.hostname,
      port: parsedURL.port,
      path: parsedURL.path,
      method: requestType,
      timeout: 300000,
      headersTimeout: 300000,
      keepAliveTimeout: 300000
    };

    if (requestType === 'GET') {
      options.path = options.path + '?' + requestData;
    }

    options.headers = oThis.header
      ? oThis.header
      : {
          'Content-Type': 'application/x-www-form-urlencoded'
        };

    logger.debug('Http Request Options: ', options);

    return new Promise(function(onResolve, onReject) {
      let chunkedResponseData = '';

      const request = (parsedURL.protocol === 'https:' ? https : http).request(options, function(response) {
        response.setEncoding('utf8');

        response.on('data', function(chunk) {
          chunkedResponseData += chunk;
        });

        response.on('end', function() {
          onResolve(
            responseHelper.successWithData({
              responseData: chunkedResponseData,
              response: {
                headers: response.headers,
                status: response.statusCode
              }
            })
          );
        });
      });

      request.on('error', function(err) {
        onReject(
          responseHelper.error({
            internal_error_identifier: 'l_hr_2',
            api_error_identifier: 'something_went_wrong',
            debug_options: { error: err }
          })
        );
      });

      // Write data to server
      if (requestType === 'POST') {
        request.write(requestData);
      }

      request.end();
    });
  }

  /**
   * Format query params.
   *
   * @param {object} queryParams: query params
   *
   * @returns {void | string | never}
   */
  formatQueryParams(queryParams) {
    return queryString
      .stringify(queryParams, {
        arrayFormat: 'brackets',
        sort: function(elementOne, elementTwo) {
          return elementOne.localeCompare(elementTwo);
        }
      })
      .replace(/%20/g, '+');
  }
}

module.exports = HttpRequest;
