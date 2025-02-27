/**
 * Util class for oAuth1
 *
 * @module helpers/oAuth1
 */

const uuidV4 = require('uuid/v4');

const rootPrefix = '..',
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
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
 * Class for oAuth1 helper.
 *
 * @class Oauth1Helper
 */
class Oauth1Helper {
  /**
   * Constructor for oAuth1 helper.
   *
   * @param {object} params
   * @param {string} params.requestType
   * @param {string} params.url
   * @param {object} params.requestParams
   * @param {object} params.oAuthCredentials
   * @param {string} params.oAuthCredentials.oAuthConsumerKey
   * @param {string} params.oAuthCredentials.oAuthConsumerSecret
   * @param {string} params.oAuthCredentials.oAuthToken
   * @param {string} params.oAuthCredentials.oAuthTokenSecret
   * @param {object} params.authorizationHeader
   */
  constructor(params) {
    const oThis = this;

    oThis.requestType = params.requestType;
    oThis.url = params.url;
    oThis.requestParams = params.requestParams || {};
    oThis.oAuthCredentials = params.oAuthCredentials;

    oThis.extraAuthorizationHeader = params.authorizationHeader || {};

    oThis.oAuthConsumerKey = oThis.oAuthCredentials.oAuthConsumerKey;
    oThis.oAuthConsumerSecret = oThis.oAuthCredentials.oAuthConsumerSecret;

    oThis.oAuthToken = oThis.oAuthCredentials.oAuthToken;
    oThis.oAuthTokenSecret = oThis.oAuthCredentials.oAuthTokenSecret;

    oThis.hasAccessToken = !CommonValidator.isVarNullOrUndefined(oThis.oAuthTokenSecret);

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

    return responseHelper.successWithData(oThis._serviceResponse());
  }

  /**
   * Set Authorization Headers
   *
   * @return {Null}
   * @private
   */
  _setAuthorizationHeader() {
    const oThis = this;

    const currentTime = Math.floor(Date.now() / 1000);
    const nonce = uuidV4();

    oThis.authorizationHeaders = {
      oauth_consumer_key: oThis.oAuthConsumerKey,
      oauth_nonce: nonce,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: currentTime,
      oauth_version: '1.0'
    };

    Object.assign(oThis.authorizationHeaders, oThis.extraAuthorizationHeader);

    if (oThis.hasAccessToken) {
      oThis.authorizationHeaders.oauth_token = oThis.oAuthToken;
    }
  }

  /**
   * Set signature in authorization headers.
   *
   * @sets oThis.authorizationHeaders
   *
   * @private
   */
  _setSignature() {
    const oThis = this;

    const signatureBaseString = oThis._getSignatureBaseString();
    const signingKey = oThis._getSigningKey();

    const signature = util.createSha1DigestBase64(signingKey, signatureBaseString);
    oThis.authorizationHeaders.oauth_signature = signature;
  }

  /**
   * Set authorization headers.
   *
   * @return {object}
   * @private
   */
  _serviceResponse() {
    const oThis = this;
    let authorizationHeaderStr = null;

    for (const key in oThis.authorizationHeaders) {
      const val = encodeURIComponent(oThis.authorizationHeaders[key]);

      if (authorizationHeaderStr === null) {
        authorizationHeaderStr = 'OAuth ';
      } else {
        authorizationHeaderStr += ',';
      }
      authorizationHeaderStr = authorizationHeaderStr + encodeURIComponent(key) + '="' + val + '"';
    }

    return { authorizationHeaderStr: authorizationHeaderStr };
  }

  /**
   * Get signature base string for Oauth signature.
   *
   * @return {string}
   * @private
   */
  _getSignatureBaseString() {
    const oThis = this;
    let baseStr = '',
      parameterString = '';

    baseStr = baseStr + oThis.requestType.toUpperCase() + '&';
    baseStr = baseStr + oThis._getPercentEncodedString(oThis.url) + '&';

    const allParams = Object.assign(oThis.requestParams, oThis.authorizationHeaders);

    Object.keys(allParams)
      .sort()
      .forEach(function(key) {
        const val = allParams[key];
        if (parameterString !== '') {
          parameterString += '&';
        }

        parameterString =
          parameterString + oThis._getPercentEncodedString(key) + '=' + oThis._getPercentEncodedString(val);
      });

    baseStr += oThis._getPercentEncodedString(parameterString);

    return baseStr;
  }

  /**
   * Get signing key for Oauth signature.
   *
   * @return {string}
   * @private
   */
  _getSigningKey() {
    const oThis = this;

    let key = oThis._getPercentEncodedString(oThis.oAuthConsumerSecret) + '&';

    if (oThis.hasAccessToken) {
      key += oThis._getPercentEncodedString(oThis.oAuthTokenSecret);
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
    const bufferArray = [];

    // Note: Long Integer values cannot be converted directly as there would be loss of precision convertToBigNumber.
    srcString = srcString.toString();

    for (let i = 0; i < srcString.length; i++) {
      const character = srcString.charAt(i);
      const bufferBytes = Buffer.from(character);

      for (let j = 0; j < bufferBytes.length; j++) {
        const bufferByte = bufferBytes.slice(j, j + 1);
        const bufferHexStr = bufferByte.toString('hex').toUpperCase();

        if (BYTE_MAP[bufferHexStr]) {
          bufferArray.push(bufferByte);
        } else {
          bufferArray.push(percentBufferByte);
          for (let k = 0; k < bufferHexStr.length; k++) {
            const bufferHexCharacter = bufferHexStr.charAt(k);
            bufferArray.push(Buffer.from(bufferHexCharacter));
          }
        }
      }
    }

    return Buffer.concat(bufferArray).toString();
  }
}

module.exports = Oauth1Helper;
