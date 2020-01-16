/**
 * Apple get public key
 *
 * @module lib/socialConnect/google/auth/UserInfo
 */
const rootPrefix = '../../../..',
  AppleAuthBase = require(rootPrefix + '/lib/socialConnect/apple/auth/Base');

const APPLE_API_URL = 'https://appleid.apple.com';

class GetPublicKey extends AppleAuthBase {
  constructor(params) {
    super(params);
  }

  /**
   * Perform
   *
   * @returns {Promise<*>}
   */
  async perform() {
    let dataReceived = await super.perform();

    console.log('----dataReceived---', dataReceived);

    // const pubKey = new NodeRSA();
    // pubKey.importKey({ n: Buffer.from(key.n, 'base64'), e: Buffer.from(key.e, 'base64') }, 'components-public');
    // return pubKey.exportKey(['public']);
  }

  /**
   * Get complete url
   *
   * @private
   */
  _getCompleteUrl() {
    const oThis = this;

    return APPLE_API_URL + '/auth/keys';
  }

  /**
   * Get header information
   *
   * @private
   */
  _getHeader() {
    const oThis = this;

    return {
      'Content-Type': 'application/x-www-form-urlencoded'
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

module.exports = GetPublicKey;
