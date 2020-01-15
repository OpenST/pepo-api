/**
 * Twitter Authorization
 *
 * @module lib/socialConnect/twitter/oAuth1.0/Authorization
 */
const rootPrefix = '../../../..',
  Base = require(rootPrefix + '/lib/socialConnect/twitter/oAuth1.0/Base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for Twitter oauth authorization.
 *
 * @class Authorization
 */
class Authorization extends Base {
  /**
   * Constructor
   *
   * @constructor
   */
  constructor() {
    super();
    const oThis = this;

    oThis.resource = 'https://api.twitter.com/oauth';
  }

  /**
   * Request token
   *
   * @returns {Promise<*>}
   */
  async requestToken() {
    const oThis = this;

    let completeUrl = oThis.resource + '/request_token';

    let oAuthCredentials = {
        oAuthConsumerKey: coreConstants.TWITTER_CONSUMER_KEY,
        oAuthConsumerSecret: coreConstants.TWITTER_CONSUMER_SECRET
      },
      twitterRequestParams = {
        requestType: 'POST',
        completeUrl: completeUrl,
        authorizationHeader: { oauth_callback: coreConstants.TWITTER_AUTH_CALLBACK_ROUTE },
        oAuthCredentials: oAuthCredentials
      };

    let response = await oThis._fireRequest(twitterRequestParams);

    let parsedResponse = oThis._parseOAuthTokenResponse(response.data);
    if (parsedResponse.isFailure()) {
      return parsedResponse;
    }

    let parsedResponseData = parsedResponse.data.response;

    let finalResponse = {
      oAuthToken: parsedResponseData.oauth_token,
      oAuthTokenSecret: parsedResponseData.oauth_token_secret,
      oAuthCallbackConfirmed: parsedResponseData.oauth_callback_confirmed
    };

    return responseHelper.successWithData(finalResponse);
  }

  /**
   * Access Token
   *
   * @param {Object} params
   * @param {String} params.oAuthToken: oAuthToken
   * @param {String} params.oAuthTokenSecret: oAuthTokenSecret
   * @param {String} params.oAuthVerifier: oAuthVerifier
   *
   * @returns {Promise<*>}
   */
  async accessToken(params) {
    const oThis = this;

    let completeUrl = oThis.resource + '/access_token',
      oAuthVerifier = params.oAuthVerifier;

    let oAuthCredentials = {
        oAuthConsumerKey: coreConstants.TWITTER_CONSUMER_KEY,
        oAuthConsumerSecret: coreConstants.TWITTER_CONSUMER_SECRET,
        oAuthToken: params.oAuthToken,
        oAuthTokenSecret: params.oAuthTokenSecret
      },
      twitterRequestParams = {
        requestType: 'POST',
        completeUrl: completeUrl,
        oAuthCredentials: oAuthCredentials,
        requestParams: { oauth_verifier: oAuthVerifier }
      };

    let response = await oThis._fireRequest(twitterRequestParams);

    let parsedResponse = oThis._parseOAuthTokenResponse(response.data);
    if (parsedResponse.isFailure()) {
      return parsedResponse;
    }

    let parsedResponseData = parsedResponse.data.response;

    let finalResponse = {
      oAuthToken: parsedResponseData.oauth_token,
      oAuthTokenSecret: parsedResponseData.oauth_token_secret,
      userId: parsedResponseData.user_id,
      screenName: parsedResponseData.screen_name
    };

    return responseHelper.successWithData(finalResponse);
  }
}

module.exports = Authorization;
