/**
 * Gmail auth get user info
 *
 * @module lib/socialConnect/google/auth/UserInfo
 */
const rootPrefix = '../../../..',
  GoogleAuthBase = require(rootPrefix + '/lib/connect/wrappers/google/Base');

const GOOGLE_API_URL = 'https://www.googleapis.com';

class UserInfo extends GoogleAuthBase {
  constructor(params) {
    super(params);
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

    return GOOGLE_API_URL + '/oauth2/v2/userinfo';
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

    return 'GET';
  }

  /**
   * Request params
   *
   * @returns {{}}
   * @private
   */
  _requestParams() {
    return {};
  }
}

module.exports = UserInfo;
