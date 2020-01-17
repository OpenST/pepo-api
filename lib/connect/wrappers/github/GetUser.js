/**
 * Github Get User API.
 *
 * @module lib/connect/wrappers/github/GetUser
 */
const rootPrefix = '../../../..',
  GithubAuthBase = require(rootPrefix + '/lib/connect/wrappers/github/Base'),
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
      parsedResponseData = parsedResponse.data.response;

    return responseHelper.successWithData(parsedResponseData);
  }
}

module.exports = GithubSocialConnectGetUserApi;
