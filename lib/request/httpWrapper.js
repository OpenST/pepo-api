const http = require('http'),
  https = require('https'),
  urlParser = require('url'),
  querystring = require('querystring');

const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  version = require(rootPrefix + '/package.json').version,
  httpUserAgent = `${coreConstants.APP_NAME} ${version}`;

class HttpWrapper {
  /**
   * Send get request
   *
   * @param {String} resource: API Resource
   * @param {Object} queryParams: resource query parameters
   *
   * @public
   */
  makeGetRequest(resource, queryParams) {
    const oThis = this;

    return oThis._send('GET', resource, queryParams);
  }

  /**
   * Send post request
   *
   * @param {String} resource: API Resource
   * @param {Object} queryParams: resource query parameters
   *
   * @public
   */
  makePostRequest(resource, queryParams) {
    const oThis = this;

    return oThis._send('POST', resource, queryParams);
  }

  /**
   * Check if parameter is present.
   *
   * @param {String/Object} param: parameter value
   *
   * @public
   */
  isPresent(param) {
    return typeof param !== 'undefined' && param !== null && String(param).trim() !== '';
  }

  /**
   * Format query params.
   *
   * @param {Object} queryParams: query params
   *
   * @private
   */
  formatQueryParams(queryParams) {
    let a = querystring.stringify(queryParams);

    // /*let a = querystring
    //   .stringify(queryParams, {
    //     arrayFormat: 'brackets',
    //     sort: function(a, b) {
    //       return a.localeCompare(b);
    //     }
    //   })
    //   .replace(/%20/g, '+');*/

    return a;
  }

  /**
   * Send request
   *
   * @param {String} requestType: API request type
   * @param {String} resource: API Resource
   * @param {Object} queryParams: resource query parameters
   *
   * @private
   */
  _send(requestType, resource, queryParams) {
    const oThis = this;

    const parsedURL = urlParser.parse(resource),
      requestData = oThis.formatQueryParams(queryParams); //oThis._formatQueryParams(resource, queryParams);

    const options = {
      host: parsedURL.hostname,
      port: parsedURL.port,
      path: parsedURL.path,
      method: requestType,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': httpUserAgent
      }
    };

    console.log('options----', options);

    if (requestType === 'GET' && oThis.isPresent(requestData)) {
      options.path = options.path + '?' + requestData;
    }

    return new Promise(async function(onResolve, onReject) {
      let chunkedResponseData = '';

      const request = (parsedURL.protocol === 'https:' ? https : http).request(options, function(response) {
        response.setEncoding('utf8');

        response.on('data', function(chunk) {
          chunkedResponseData += chunk;
        });

        response.on('end', function() {
          const parsedResponse = oThis._parseResponse(chunkedResponseData, response);

          if (parsedResponse.success) {
            onResolve(parsedResponse);
          } else {
            console.error('On end, error: ', parsedResponse);
            onReject(parsedResponse);
          }
        });
      });

      request.on('socket', function(socket) {
        socket.setTimeout(5000);
        socket.on('timeout', function(error) {
          console.error('Error: ', error);
          onReject({
            success: false,
            err: { code: 'GATEWAY_TIMEOUT', internal_id: 'TIMEOUT_ERROR', msg: '', error_data: [] }
          });
        });
      });

      request.on('error', function(error) {
        console.error('HTTP: Request error');
        console.error(error);
        const parsedResponse = oThis._parseResponse(error);
        if (parsedResponse.success) {
          onResolve(parsedResponse);
        } else {
          console.error('On error, error: ', error);
          onReject(parsedResponse);
        }
      });

      // Write data to server
      if (requestType === 'POST' && oThis.isPresent(requestData)) {
        request.write(requestData);
      }
      request.end();
    });
  }

  /**
   * Parse response.
   *
   * @param {String} responseData: Response data
   * @param {Object} [response]: Response object
   *
   * @private
   */
  _parseResponse(responseData, response) {
    const oThis = this;

    if (!oThis.isPresent(responseData) || (response || {}).statusCode != 200) {
      switch ((response || {}).statusCode) {
        case 400:
          responseData =
            responseData ||
            '{"success": false, "err": {"code": "BAD_REQUEST", "internal_id": "SDK(BAD_REQUEST)", "msg": "", "error_data":[]}}';
          break;
        case 429:
          responseData =
            responseData ||
            '{"success": false, "err": {"code": "TOO_MANY_REQUESTS", "internal_id": "SDK(TOO_MANY_REQUESTS)", "msg": "", "error_data":[]}}';
          break;
        case 502:
          responseData =
            responseData ||
            '{"success": false, "err": {"code": "BAD_GATEWAY", "internal_id": "SDK(BAD_GATEWAY)", "msg": "", "error_data":[]}}';
          break;
        case 503:
          responseData =
            responseData ||
            '{"success": false, "err": {"code": "SERVICE_UNAVAILABLE", "internal_id": "SDK(SERVICE_UNAVAILABLE)", "msg": "", "error_data":[]}}';
          break;
        case 504:
          responseData =
            responseData ||
            '{"success": false, "err": {"code": "GATEWAY_TIMEOUT", "internal_id": "SDK(GATEWAY_TIMEOUT)", "msg": "", "error_data":[]}}';
          break;
        default:
          responseData =
            responseData ||
            '{"success": false, "err": {"code": "SOMETHING_WENT_WRONG", "internal_id": "SDK(SOMETHING_WENT_WRONG)", "msg": "", "error_data":[]}}';
      }
    }

    let parsedResponse = null;
    try {
      parsedResponse = JSON.parse(responseData);
      parsedResponse.success = !parsedResponse.error;
    } catch (e) {
      console.error('Failed in JSON parsing. Error: ', e);
      parsedResponse = {
        success: false,
        err: {
          code: 'SOMETHING_WENT_WRONG',
          internal_id: 'l_pc_seb_1',
          msg: 'Response parsing error',
          error_data: []
        }
      };
    }

    return parsedResponse;
  }
}

module.exports = new HttpWrapper();
