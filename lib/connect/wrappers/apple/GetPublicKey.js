/**
 * Apple get public key
 *
 * @module lib/connect/wrappers/apple/GetPublicKey
 */
const NodeRSA = require('node-rsa');

const rootPrefix = '../../../..',
  AppleAuthBase = require(rootPrefix + '/lib/connect/wrappers/apple/Base');

const APPLE_API_URL = 'https://appleid.apple.com';

class GetPublicKey extends AppleAuthBase {
  constructor(params) {
    super(params);
  }

  /**
   * Perform
   *
   * @returns {Promise<array>}
   */
  async perform() {
    let dataReceived = await super.perform(),
      publicKeys = [];

    for (let index = 0; index < dataReceived.keys.length; index++) {
      let key = dataReceived.keys[index];
      let pubKey = new NodeRSA();
      pubKey.importKey({ n: Buffer.from(key.n, 'base64'), e: Buffer.from(key.e, 'base64') }, 'components-public');
      publicKeys.push(pubKey.exportKey(['public']));
    }

    return publicKeys;
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
