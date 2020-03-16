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
   * Constructor for Github auth base.
   *
   * @constructor
   */
  constructor() {
    const oThis = this;

    oThis.resource = 'https://api.github.com/';
  }

  /**
   * Fire http request.
   *
   * @param {object} githubRequestParams
   *
   * @returns {Promise<*>}
   * @private
   */
  async _fireRequest(githubRequestParams) {
    const oThis = this;

    const requestParams = githubRequestParams.requestParams || {};

    const requestHeader = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': oThis.githubUserAgent,
      Authorization: oThis.githubAuthorizationBearerString + githubRequestParams.oAuthToken
    };

    const HttpLibObj = new HttpLibrary({ resource: githubRequestParams.completeUrl, header: requestHeader });

    let responseData = null;

    if (githubRequestParams.requestType === 'GET') {
      responseData = await HttpLibObj.get(requestParams).catch(function(err) {
        return err;
      });
    } else if (githubRequestParams.requestType === 'POST') {
      responseData = await HttpLibObj.post(requestParams).catch(function(err) {
        return err;
      });
    }

    if (responseData.isFailure()) {
      return Promise.reject(responseData);
    }

    responseData = sanitizer.sanitizeParams(responseData);

    console.log('responseData ======', responseData);

    return responseData;
  }

  /**
   * Parse json response.
   *
   * @param {object} jSonResponse
   *
   * @returns {Promise<*>}
   * @private
   */
  async _parseJsonResponse(jSonResponse) {
    let parsedResponseData = null;

    try {
      parsedResponseData = JSON.parse(jSonResponse.responseData);
    } catch (err) {
      logger.error('Error in json parse of response');

      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_c_w_gh_b_1',
          api_error_identifier: 'unauthorized_api_request',
          debug_options: { Error: err }
        })
      );
    }

    if (jSonResponse.response.status == 200) {
      return responseHelper.successWithData({ response: parsedResponseData, headers: jSonResponse.response.headers });
    }

    const errorObject = responseHelper.error({
      internal_error_identifier: 'l_c_w_gh_b_2',
      api_error_identifier: 'something_went_wrong',
      debug_options: { jSonResponse: jSonResponse }
    });

    await createErrorLogsEntry.perform(errorObject, errorLogsConstants.lowSeverity);

    return Promise.reject(errorObject);
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
