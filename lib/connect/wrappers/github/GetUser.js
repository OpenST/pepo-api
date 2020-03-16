const rootPrefix = '../../../..',
  GithubAuthBase = require(rootPrefix + '/lib/connect/wrappers/github/Base'),
  GithubUserFormatter = require(rootPrefix + '/lib/connect/wrappers/github/UserEntityFormatter'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for github social connect get user.
 *
 * @class GithubSocialConnectGetUserApi
 */
class GithubSocialConnectGetUserApi extends GithubAuthBase {
  /**
   * Get user.
   *
   * @returns {Promise<*>}
   */
  async getUser(params) {
    const oThis = this;

    const completeUrl = oThis.resource + 'user';

    const githubRequestParams = {
      requestType: 'GET',
      completeUrl: completeUrl,
      oAuthToken: params.oAuthToken
    };

    const response = await oThis._fireRequest(githubRequestParams);

    const parsedResponse = await oThis._parseJsonResponse(response.data),
      formattedResponse = new GithubUserFormatter(parsedResponse.data.response);

    return responseHelper.successWithData(formattedResponse);
  }
}

module.exports = GithubSocialConnectGetUserApi;
