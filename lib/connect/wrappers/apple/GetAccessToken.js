/**
 * Apple get access token
 *
 * @module lib/connect/wrappers/apple/GetAccessToken
 */
const rootPrefix = '../../../..',
  AppleAuthBase = require(rootPrefix + '/lib/connect/wrappers/apple/Base'),
  coreConstants = require(rootPrefix + '/config/coreConstants');

const APPLE_API_URL = 'https://appleid.apple.com';

class GetAccessToken extends AppleAuthBase {
  constructor(params) {
    super(params);
    const oThis = this;
    oThis.authorizationCode = params.authorizationCode;
    oThis.clientSecret = params.clientSecret;
    oThis.appleClientId = params.appleClientId;
    oThis.appleRedirectUri = params.appleRedirectUri;
  }

  /**
   * Perform
   *
   * @returns {Promise<*>}
   */
  async perform() {
    return super.perform();
  }

  /**
   * Get complete url
   *
   * @private
   */
  _getCompleteUrl() {
    const oThis = this;

    return APPLE_API_URL + '/auth/token';
  }

  /**
   * Get header information
   *
   * @private
   */
  _getHeader() {
    const oThis = this;

    return {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json'
    };
  }

  /**
   * Request Type
   *
   * @returns {string}
   * @private
   */
  get _requestType() {
    const oThis = this;

    return 'POST';
  }

  /**
   * Request params
   *
   * @returns {{}}
   * @private
   */
  _requestParams() {
    const oThis = this;
    return {
      client_id: oThis.appleClientId,
      client_secret: oThis.clientSecret,
      code: oThis.authorizationCode,
      grant_type: 'authorization_code',
      redirect_uri: oThis.appleRedirectUri
    };
  }
}

module.exports = GetAccessToken;
