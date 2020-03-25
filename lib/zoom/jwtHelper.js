const jwt = require('jsonwebtoken'),
  rp = require('request-promise');

const rootPrefix = '../..',
  zoomConstant = require(rootPrefix + '/lib/globalConstant/meeting/zoom');

const baseUrl = 'https://api.zoom.us/v2/';

class JwtHelper {
  /**
   * Fetch token
   *
   * @returns {undefined|*}
   */
  fetchToken() {
    const payload = {
      iss: zoomConstant.apiKey,
      exp: new Date().getTime() + 5000 // expiry is 5 seconds
    };
    return jwt.sign(payload, zoomConstant.apiSecret);
  }

  /**
   * POST API
   *
   * @param endpoint
   * @param params
   */
  // TODO - add error handling and use the usual http lib.
  postApi(endpoint, params) {
    const oThis = this;

    const token = oThis.fetchToken();

    const uri = baseUrl + endpoint;

    var options = {
      uri: uri,
      method: 'POST',
      body: params || {},
      auth: {
        bearer: token
      },
      headers: {
        'User-Agent': 'Zoom-api-Jwt-Request',
        'content-type': 'application/json'
      },
      json: true //Parse the JSON string in the response
    };

    return rp(options);
  }

  /**
   * PUT API
   *
   * @param endpoint
   * @param params
   */
  // TODO - add error handling and use the usual http lib.
  putApi(endpoint, params) {
    const oThis = this;

    const token = oThis.fetchToken();

    const uri = baseUrl + endpoint;

    var options = {
      uri: uri,
      method: 'PUT',
      body: params || {},
      auth: {
        bearer: token
      },
      headers: {
        'User-Agent': 'Zoom-api-Jwt-Request',
        'content-type': 'application/json'
      },
      json: true //Parse the JSON string in the response
    };

    return rp(options);
  }

  /**
   * POST API
   *
   * @param endpoint
   * @param params
   */
  // TODO - add error handling and use the usual http lib.
  getApi(endpoint, params) {
    const oThis = this;

    const token = oThis.fetchToken();

    const uri = baseUrl + endpoint;

    var options = {
      uri: uri,
      method: 'GET',
      qs: params || {},
      auth: {
        bearer: token
      },
      headers: {
        'User-Agent': 'Zoom-api-Jwt-Request',
        'content-type': 'application/json'
      },
      json: true //Parse the JSON string in the response
    };

    return rp(options);
  }

  /**
   * Delete API
   *
   * @param endpoint
   * @param params
   */
  // TODO - add error handling and use the usual http lib.
  deleteApi(endpoint, params) {
    const oThis = this;

    const token = oThis.fetchToken();

    const uri = baseUrl + endpoint;

    var options = {
      uri: uri,
      method: 'DELETE',
      body: params || {},
      auth: {
        bearer: token
      },
      headers: {
        'User-Agent': 'Zoom-api-Jwt-Request',
        'content-type': 'application/json'
      },
      json: true //Parse the JSON string in the response
    };

    return rp(options);
  }
}

module.exports = new JwtHelper();
