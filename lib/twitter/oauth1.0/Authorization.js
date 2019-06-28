const rootPrefix = '../../..',
  basicHelper = require(rootPrefix + '/helpers/basic'),
  oAuth1Helper = require(rootPrefix + '/helpers/oauth1'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  HttpLibrary = require(rootPrefix + '/lib/HttpRequest');

/**
 * Class for in-memory cache provider.
 *
 * @class InMemoryCacheProvider
 */
class Authorization {
  constructor() {
    const oThis = this;

    oThis.resource = 'https://api.twitter.com/oauth';
    oThis.callbackRoute = coreConstants.TWITTER_AUTH_CALLBACK_ROUTE;
  }

  /**
   * Request token
   *
   * @returns {Promise<ResultBase>}
   */
  async requestToken() {
    const oThis = this;

    let completeUrl = oThis.resource + '/request_token';

    let oAuthCredentials = {
        oauthConsumerKey: coreConstants.TWITTER_CONSUMER_KEY,
        oauthConsumerSecret: coreConstants.TWITTER_CONSUMER_SECRET
      },
      authorizationHeaderParams = {
        requestType: 'POST',
        url: completeUrl,
        oAuthCredentials: oAuthCredentials
      };

    let authorizationHeader = await new oAuth1Helper(authorizationHeaderParams).perform(),
      //authorizationHeader = 'OAuth oauth_consumer_key="LTEkY7ucjoSKYHp4qRr67AKTK",oauth_signature_method="HMAC-SHA1",oauth_timestamp="1561724943",oauth_nonce="SI9GTxxSV2T",oauth_version="1.0",oauth_signature="nMAhoAwURhFLcSCQR8vjRo2kNeI%3D"',
      header = {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: authorizationHeader,
        oauth_callback: oThis.callbackRoute
      };

    let HttpLibObj = new HttpLibrary({ resource: completeUrl, header: header }),
      responseData = await HttpLibObj.post().catch(function(err) {
        return err;
      });

    if (responseData.isFailure()) {
      return Promise.reject(responseData);
    }

    let parsedResponse = oThis._parseOAuthTokenResponse(responseData.data);
    if (parsedResponse.isFailure()) {
      return Promise.reject(parsedResponse);
    }

    let finalResponse = {
      oAuthToken: parsedResponse.data.oauth_token,
      oAuthTokenSecret: parsedResponse.data.oauth_token_secret,
      oAuthCallbackConfirmed: parsedResponse.data.oauth_callback_confirmed
    };

    return responseHelper.successWithData(finalResponse);
  }

  /**
   * Access Token
   *
   * @param {Object} params
   * @param {String} params.oauthToken: oAuthToken
   * @param {String} params.oauthTokenSecret: oAuthTokenSecret
   * @param {String} params.oauthVerifier: oauthVerifier
   *
   * @returns {Promise<*>}
   */
  async accessToken(params) {
    const oThis = this;

    let completeUrl = oThis.resource + '/access_token',
      oauthVerifier = params.oauthVerifier;

    let oAuthCredentials = {
        oauthConsumerKey: coreConstants.TWITTER_CONSUMER_KEY,
        oauthConsumerSecret: coreConstants.TWITTER_CONSUMER_SECRET,
        oauthToken: params.oauthToken,
        oauthTokenSecret: params.oauthTokenSecret
      },
      authorizationHeaderParams = {
        requestType: 'POST',
        url: completeUrl,
        oAuthCredentials: oAuthCredentials
      };

    let authorizationHeader = await new oAuth1Helper(authorizationHeaderParams).perform(),
      //authorizationHeader = 'OAuth oauth_consumer_key="LTEkY7ucjoSKYHp4qRr67AKTK",oauth_token="Nr24GAAAAAAA_NBNAAABa54QnW8",oauth_signature_method="HMAC-SHA1",oauth_timestamp="1561725105",oauth_nonce="mdKtq8IVxtn",oauth_version="1.0",oauth_signature="jYhQGS5M4bLNkxQNLH4Zc17N7C8%3D"',
      header = {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: authorizationHeader
      };

    let HttpLibObj = new HttpLibrary({ resource: completeUrl, header: header }),
      responseData = await HttpLibObj.post({ oauth_verifier: oauthVerifier }).catch(function(err) {
        return err;
      });

    if (responseData.isFailure()) {
      return Promise.reject(responseData);
    }

    let parsedResponse = oThis._parseOAuthTokenResponse(responseData.data);
    if (parsedResponse.isFailure()) {
      return Promise.reject(parsedResponse);
    }

    let finalResponse = {
      oAuthToken: parsedResponse.data.oauth_token,
      oAuthTokenSecret: parsedResponse.data.oauth_token_secret,
      userId: parsedResponse.data.user_id,
      screenName: parsedResponse.data.screen_name
    };

    return responseHelper.successWithData(finalResponse);
  }

  /**
   * Parse oAuth token response
   *
   * @param {Object} oAuthResponse
   *
   * @returns {ResultBase}
   * @private
   */
  _parseOAuthTokenResponse(oAuthResponse) {
    const oThis = this;

    if (oAuthResponse.response.status == 200) {
      let parsedResponseHash = basicHelper.parseAmpersandSeparatedKeyValue(oAuthResponse.responseData);
      return responseHelper.successWithData(parsedResponseHash);
    } else {
      return responseHelper.error({
        internal_error_identifier: 'l_t_oa_a_1',
        api_error_identifier: 'something_went_wrong',
        debug_options: { failureReason: oAuthResponse }
      });
    }
  }
}

module.exports = Authorization;
