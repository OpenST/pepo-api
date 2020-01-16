/**
 * Gmail auth get user info
 *
 * @module lib/socialConnect/google/auth/UserInfo
 */
const rootPrefix = '../../../..',
  GoogleAuthBase = require(rootPrefix + '/lib/socialConnect/google/auth/Base'),
  coreConstants = require(rootPrefix + '/config/coreConstants');

const GOOGLE_API_URL = 'https://oauth2.googleapis.com';

class RefreshAccessToken extends GoogleAuthBase {
  constructor(params) {
    super(params);
    const oThis = this;
    oThis.refreshToken = params.refreshToken;
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
      refresh_token: oThis.refreshToken,
      client_id: coreConstants.GOOGLE_CLIENT_ID,
      client_secret: coreConstants.GOOGLE_CLIENT_SECRET,
      grant_type: 'refresh_token'
    };
  }
}

module.exports = RefreshAccessToken;
