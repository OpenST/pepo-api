/**
 * Github Get User API.
 *
 * @module lib/connect/wrappers/github/GetUser
 */
const rootPrefix = '../../../..',
  GithubAuthBase = require(rootPrefix + '/lib/connect/wrappers/github/Base'),
  GithubUserFormatter = require(rootPrefix + '/lib/connect/wrappers/github/UserEntityFormatter'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for github lib.
 *
 * @class GithubSocialConnectGetUserApi
 */
class GithubSocialConnectGetUserApi extends GithubAuthBase {
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

    let parsedResponse = await oThis._parseJsonResponse(response.data),
      formattedResponse = new GithubUserFormatter(parsedResponse.data.response);

    return responseHelper.successWithData(formattedResponse);
  }
}

module.exports = GithubSocialConnectGetUserApi;
