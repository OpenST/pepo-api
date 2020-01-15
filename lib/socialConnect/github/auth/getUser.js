/**
 * Github Lib.
 *
 * @module lib/socialConnect/github/auth/getUser
 */
const rootPrefix = '../../../..',
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  HttpLibrary = require(rootPrefix + '/lib/HttpRequest'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry');

/**
 * Class for github lib.
 *
 * @class GithubSocialConnect
 */
class GithubSocialConnect {
  /**
   * Constructor
   *
   * @constructor
   */
  constructor() {
    const oThis = this;

    oThis.resource = 'https://api.github.com/';
  }

  /**
   * Get User.
   *
   * @returns {Promise<*>}
   */
  async getUser(params) {
    const oThis = this;

    let completeUrl = oThis.resource + 'user';

    let githubRequestParams = {
      requestType: 'GET',
      completeUrl: completeUrl,
      oAuthToken: params.oAuthToken
    };

    let response = await oThis._fireRequest(githubRequestParams);

    let parsedResponse = await oThis._parseJsonResponse(response.data);

    let parsedResponseData = parsedResponse.data.response;

    return responseHelper.successWithData(parsedResponseData);
  }

  /**
   * Get User Emails.
   *
   * @returns {Promise<*>}
   */
  async getUserEmails(params) {
    const oThis = this;

    let completeUrl = oThis.resource + 'user/emails';

    let githubRequestParams = {
      requestType: 'GET',
      completeUrl: completeUrl,
      oAuthToken: params.oAuthToken
    };

    let response = await oThis._fireRequest(githubRequestParams);

    let parsedResponse = await oThis._parseJsonResponse(response.data);

    let parsedResponseData = parsedResponse.data.response;

    return responseHelper.successWithData(parsedResponseData);
  }

  /**
   * Fire Http Request
   *
   * @param {Object} githubRequestParams
   * @returns {Promise<*>}
   * @private
   */
  async _fireRequest(githubRequestParams) {
    const oThis = this;

    let requestParams = githubRequestParams.requestParams || {};

    let requestHeader = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': oThis.githubUserAgent,
      Authorization: oThis.githubAuthorizationBearerString + githubRequestParams.oAuthToken
    };

    let HttpLibObj = new HttpLibrary({ resource: githubRequestParams.completeUrl, header: requestHeader }),
      responseData = null;

    if (githubRequestParams.requestType == 'GET') {
      responseData = await HttpLibObj.get(requestParams).catch(function(err) {
        return err;
      });
    } else if (githubRequestParams.requestType == 'POST') {
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
      return responseHelper.successWithData({ response: parsedResponseData, headers: jSonResponse.response.headers });
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

  // Default variable values starts here.
  get githubUserAgent() {
    return 'pepo_api_backend';
  }

  get githubAuthorizationBearerString() {
    return 'Bearer ';
  }
}

module.exports = GithubSocialConnect;
