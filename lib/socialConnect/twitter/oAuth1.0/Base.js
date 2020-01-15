/**
 * Twitter Oauth Base
 *
 * @module lib/socialConnect/twitter/oAuth1.0/Base
 */
const rootPrefix = '../../../..',
  basicHelper = require(rootPrefix + '/helpers/basic'),
  oAuth1Helper = require(rootPrefix + '/helpers/oAuth1'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  HttpLibrary = require(rootPrefix + '/lib/HttpRequest'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry');

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
   * @param {Object} twitterRequestParams
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

    responseData = sanitizer.sanitizeParams(responseData);

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
      return responseHelper.successWithData({ response: parsedResponseHash, headers: oAuthResponse.response.headers });
    } else {
      return responseHelper.error({
        internal_error_identifier: 'l_t_oa_a_1',
        api_error_identifier: 'something_went_wrong',
        debug_options: { failureReason: oAuthResponse }
      });
    }
  }

  /**
   * Parse json response.
   *
   * @param {Object} jSonResponse
   * @returns {Promise<*>}
   * @private
   */
  async _parseJsonResponse(jSonResponse) {
    const oThis = this;

    const parsedResponseData = JSON.parse(jSonResponse.responseData);

    if (jSonResponse.response.status == 200) {
      let parsedResponseHash = basicHelper.parseTwitterJsonResponse(jSonResponse.responseData);
      return responseHelper.successWithData({ response: parsedResponseHash, headers: jSonResponse.response.headers });
    } else if (parsedResponseData.errors[0].code == 187) {
      return responseHelper.error({
        internal_error_identifier: 'l_t_oa_a_1',
        api_error_identifier: 'duplicate_tweet',
        debug_options: { parsedResponseData: parsedResponseData, headers: jSonResponse.response.headers }
      });
    } else if ([89, 215, 32].indexOf(parsedResponseData.errors[0].code) != -1) {
      return responseHelper.error({
        internal_error_identifier: 'l_t_oa_a_2',
        api_error_identifier: 'twitter_unauthorized',
        debug_options: { parsedResponseData: parsedResponseData, headers: jSonResponse.response.headers }
      });
    } else if (jSonResponse.response.status == 429) {
      return responseHelper.error({
        internal_error_identifier: 'l_t_oa_a_3',
        api_error_identifier: 'twitter_rate_limit',
        debug_options: { parsedResponseData: parsedResponseData, headers: jSonResponse.response.headers }
      });
    } else if (jSonResponse.response.status === 304 || jSonResponse.response.status === 403) {
      logger.error('Error :::', parsedResponseData);

      return responseHelper.error({
        internal_error_identifier: 'l_t_oa_a_4',
        api_error_identifier: 'something_went_wrong',
        debug_options: { parsedResponseData: parsedResponseData, headers: jSonResponse.response.headers }
      });
    } else {
      const errorObject = responseHelper.error({
        internal_error_identifier: 'l_t_oa_a_5',
        api_error_identifier: 'something_went_wrong',
        debug_options: { jSonResponse: jSonResponse }
      });

      await createErrorLogsEntry.perform(errorObject, errorLogsConstants.lowSeverity);

      return errorObject;
    }
  }
}

module.exports = Base;
