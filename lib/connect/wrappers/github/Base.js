/**
 * Github auth base.
 *
 * @module lib/connect/wrappers/github/Base
 */
const rootPrefix = '../../../..',
  HttpLibrary = require(rootPrefix + '/lib/HttpRequest'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs');

/**
 * Class for Github auth base.
 *
 * @class GithubSocialConnectAuthBase
 */
class GithubSocialConnectAuthBase {
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
    } else {
      const errorObject = responseHelper.error({
        internal_error_identifier: 'l_c_w_gh_5',
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

module.exports = GithubSocialConnectAuthBase;
