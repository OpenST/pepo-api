/**
 * Twitter Request Token
 *
 * @module app/services/oAuth1/twitter/RequestToken
 */
const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  OAuthAuthroization = require(rootPrefix + '/lib/twitter/oauth1.0/Authorization'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for request token.
 *
 * @class RequestToken
 */
class RequestToken extends ServiceBase {
  /**
   * constructor
   *
   * @constructor
   */
  constructor() {
    super();
  }

  async _asyncPerform() {
    const oThis = this;

    let oAuthAuthorizationResponse = await new OAuthAuthroization().requestToken();

    if (oAuthAuthorizationResponse.isFailure()) {
      return Promise.reject(oAuthAuthorizationResponse);
    }

    //insertData in DB
    return oAuthAuthorizationResponse;
  }
}

module.exports = RequestToken;
