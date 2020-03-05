/**
 * Google access token.
 *
 * @module lib/connect/wrappers/google/GetAccessToken
 */
const rootPrefix = '../../../..',
  GoogleAuthBase = require(rootPrefix + '/lib/connect/wrappers/google/Base'),
  coreConstants = require(rootPrefix + '/config/coreConstants');

const GOOGLE_API_URL = 'https://oauth2.googleapis.com';

class GetAccessToken extends GoogleAuthBase {
  constructor(params) {
    super(params);
    const oThis = this;
    oThis.googleAuthorizationCode = params.code;
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

    return GOOGLE_API_URL + '/token';
  }

  /**
   * Get header information
   *
   * @private
   */
  _getHeader() {
    const oThis = this;

    return {
      Authorization: `Bearer ${oThis.accessToken}`,
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
      code: oThis.googleAuthorizationCode,
      client_id: coreConstants.GOOGLE_CLIENT_ID,
      client_secret: coreConstants.GOOGLE_CLIENT_SECRET,
      grant_type: 'authorization_code',
      redirect_uri: coreConstants.GOOGLE_REDIRECT_URI
    };
  }
}

module.exports = GetAccessToken;
