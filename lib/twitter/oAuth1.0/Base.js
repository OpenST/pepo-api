/**
 * Twitter Oauth Base
 *
 * @module lib/twitter/oAuth1.0/Base
 */
const rootPrefix = '../../..',
  basicHelper = require(rootPrefix + '/helpers/basic'),
  oAuth1Helper = require(rootPrefix + '/helpers/oAuth1'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  HttpLibrary = require(rootPrefix + '/lib/HttpRequest');

/**
 * Class for Twitter oauth authorization base.
 *
 * @class Base
 */
class Base {
  /**
   * Constructor
   *
   * @constructor
   */
  constructor() {}

  /**
   * Fire Http Request
   *
   * @param {Object} authorizationHeaderParams
   * @param {String} completeUrl
   * @param {Object} queryParams
   * @returns {Promise<*>}
   * @private
   */
  async _fireRequest(twitterRequestParams) {
    const oThis = this;

    let requestParams = twitterRequestParams.requestParams || {},
      twitterAuthorizationHeader = {
        requestType: twitterRequestParams.requestType,
        url: twitterRequestParams.completeUrl,
        authorizationHeader: twitterRequestParams.authorizationHeader,
        oAuthCredentials: twitterRequestParams.oAuthCredentials,
        requestParams: requestParams
      };

    let authorizationHeader = await new oAuth1Helper(twitterAuthorizationHeader).perform();

    if (authorizationHeader.isFailure()) {
      return Promise.reject(authorizationHeader);
    }

    let header = {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: authorizationHeader.data.authorizationHeaderStr
    };

    let HttpLibObj = new HttpLibrary({ resource: twitterRequestParams.completeUrl, header: header }),
      responseData = null;

    if (twitterRequestParams.requestType == 'GET') {
      responseData = await HttpLibObj.get(requestParams).catch(function(err) {
        return err;
      });
    } else if (twitterRequestParams.requestType == 'POST') {
      responseData = await HttpLibObj.post(requestParams).catch(function(err) {
        return err;
      });
    }

    if (responseData.isFailure()) {
      return Promise.reject(responseData);
    }

    return responseData;
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

  /**
   * Parse json response
   *
   * @param {Object} jSonResponse
   *
   * @returns {ResultBase}
   * @private
   */
  _parseJsonResponse(jSonResponse) {
    const oThis = this;

    if (jSonResponse.response.status == 200) {
      let parsedResponseHash = basicHelper.parseTwitterJsonResponse(jSonResponse.responseData);
      return responseHelper.successWithData(parsedResponseHash);
    } else {
      return responseHelper.error({
        internal_error_identifier: 'l_t_oa_a_2',
        api_error_identifier: 'something_went_wrong',
        debug_options: { failureReason: jSonResponse }
      });
    }
  }
}

module.exports = Base;
