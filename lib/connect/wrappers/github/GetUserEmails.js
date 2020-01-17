/**
 * Github Get User Emails API.
 *
 * @module lib/connect/wrappers/github/GetUserEmails
 */
const rootPrefix = '../../../..',
  GithubAuthBase = require(rootPrefix + '/lib/connect/wrappers/github/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for github lib.
 *
 * @class GithubSocialConnectGetUserEmails
 */
class GithubSocialConnectGetUserEmails extends GithubAuthBase {
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

    let parsedResponse = await oThis._parseJsonResponse(response.data),
      parsedResponseData = parsedResponse.data.response;

    return responseHelper.successWithData(parsedResponseData);
  }
}

module.exports = GithubSocialConnectGetUserEmails;
