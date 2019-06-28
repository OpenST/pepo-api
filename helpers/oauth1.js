/**
 * Util class for oauth1
 *
 * @module helpers/oath1
 */

const uuid = require('uuid');

const rootPrefix = '..',
  util = require(rootPrefix + '/lib/util'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

const BYTE_MAP = {
  '30': '1',
  '31': '1',
  '32': '1',
  '33': '1',
  '34': '1',
  '35': '1',
  '36': '1',
  '37': '1',
  '38': '1',
  '39': '1',

  '41': '1',
  '42': '1',
  '43': '1',
  '44': '1',
  '45': '1',
  '46': '1',
  '47': '1',
  '48': '1',
  '49': '1',
  '4A': '1',
  '4B': '1',
  '4C': '1',
  '4D': '1',
  '4E': '1',
  '4F': '1',
  '50': '1',
  '51': '1',
  '52': '1',
  '53': '1',
  '54': '1',
  '55': '1',
  '56': '1',
  '57': '1',
  '58': '1',
  '59': '1',
  '5A': '1',

  '61': '1',
  '62': '1',
  '63': '1',
  '64': '1',
  '65': '1',
  '66': '1',
  '67': '1',
  '68': '1',
  '69': '1',
  '6A': '1',
  '6B': '1',
  '6C': '1',
  '6D': '1',
  '6E': '1',
  '6F': '1',
  '70': '1',
  '71': '1',
  '72': '1',
  '73': '1',
  '74': '1',
  '75': '1',
  '76': '1',
  '77': '1',
  '78': '1',
  '79': '1',
  '7A': '1',

  '2D': '1',
  '2E': '1',
  '5F': '1',
  '7E': '1'
};

const percentBufferByte = Buffer.from('%');

/**
 * Class for oauth1 helper.
 *
 * @class Oauth1Helper
 */
class Oauth1Helper {
  /**
   * Constructor to set login cookie.
   *
   * @param {string} cookieValue
   */
  constructor(params) {
    const oThis = this;

    oThis.requestType = params.requestType;
    oThis.url = params.url;
    oThis.requestParams = params.requestParams;
    oThis.oAuthCredentials = params.oAuthCredentials;

    oThis.oauthConsumerKey = oThis.oAuthCredentials.oauthConsumerKey;
    oThis.oauthConsumerSecret = oThis.oAuthCredentials.oauthConsumerSecret;

    oThis.oauthToken = oThis.oAuthCredentials.oauthToken;
    oThis.oauthTokenSecret = oThis.oAuthCredentials.oauthTokenSecret;

    oThis.hasAccessToken = oThis.oauthTokenSecret != null;

    oThis.authorizationHeaders = {};
  }

  /**
   * Perform.
   *
   * @return {result}
   */
  perform() {
    const oThis = this;

    oThis._setAuthorizationHeader();
    oThis._setSignature();

    return responseHelper.successWithData({ authorizationHeader: oThis.authorizationHeaders });
  }

  /**
   * Set Authorization Headers
   *
   * @return {Null}
   * @private
   */
  _setAuthorizationHeader() {
    const oThis = this;

    let currentTime = Math.floor(Date.now() / 1000);
    let nonce = uuid.v4();

    oThis.authorizationHeaders = {
      oauth_consumer_key: oThis.oauthConsumerKey,
      oauth_nonce: nonce,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: currentTime,
      oauth_version: '1.0'
    };

    if (oThis.hasAccessToken) {
      oThis.authorizationHeaders['oauth_token'] = oThis.oauthToken;
    }
  }

  /**
   * Set Signature in Authorization Headers
   *
   * @return {Null}
   * @private
   */
  _setSignature() {
    const oThis = this;

    let signatureBaseString = oThis._getSignatureBaseString();
    let signingKey = oThis._getSigningKey();

    let signature = util.createSha256Digest(signingKey, signatureBaseString);
    oThis.authorizationHeaders['oauth_signature'] = signature;
  }

  /**
   * Get Signature Base String For Oauth Signature
   *
   * @return {String}
   * @private
   */
  _getSignatureBaseString() {
    const oThis = this;
    let baseStr = '',
      parameterString = '';

    baseStr = baseStr + oThis.requestType.toUpperCase() + '&';
    baseStr = baseStr + oThis._getPercentEncodedString(oThis.url) + '&';

    let allParams = Object.assign(oThis.authorizationHeaders, oThis.requestParams);

    Object.keys(allParams)
      .sort()
      .forEach(function(key) {
        let val = allParams[key];
        if (parameterString !== '') {
          parameterString = parameterString + '&';
        }

        parameterString =
          parameterString + oThis._getPercentEncodedString(key) + '=' + oThis._getPercentEncodedString(val);
      });

    baseStr = baseStr + oThis._getPercentEncodedString(parameterString);

    return baseStr;
  }

  /**
   * Get Signing Key For Oauth Signature
   *
   * @return {String}
   * @private
   */
  _getSigningKey() {
    const oThis = this;

    let key = oThis._getPercentEncodedString(oThis.oauthConsumerSecret);

    if (oThis.hasAccessToken) {
      key = key + '&' + oThis._getPercentEncodedString(oThis.oauthTokenSecret);
    }

    return key;
  }

  /**
   * Get Percent Encoded String For Oauth Signature
   *
   * @return {String}
   * @private
   */
  _getPercentEncodedString(srcString) {
    let bufferArray = [];

    for (var i = 0; i < srcString.length; i++) {
      const character = srcString.charAt(i);
      let bufferBytes = Buffer.from(character);

      for (var j = 0; j < bufferBytes.length; j++) {
        let bufferByte = bufferBytes.slice(j, j + 1);
        let bufferHexStr = bufferByte.toString('hex');
        if (BYTE_MAP[bufferHexStr]) {
          bufferArray.push(bufferByte);
        } else {
          bufferArray.push(percentBufferByte);
          for (var k = 0; k < bufferHexStr.length; k++) {
            const bufferHexCharacter = bufferHexStr.charAt(k);
            bufferArray.push(Buffer.from(bufferHexCharacter.toUpperCase()));
          }
        }
      }
    }

    return Buffer.concat(bufferArray).toString();
  }
}

module.exports = Oauth1Helper;
