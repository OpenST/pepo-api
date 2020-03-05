/**
 * Google access token.
 *
 * @module lib/connect/wrappers/google/GetAccessToken
 */
const rootPrefix = '../../../..',
  GithubAuthBase = require(rootPrefix + '/lib/connect/wrappers/github/Base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

const GITHUB_API_URL = 'https://github.com/';

class GetAccessToken extends GithubAuthBase {
  constructor(params) {
    super(params);
    const oThis = this;
    oThis.githubAuthorizationCode = params.code;
  }

  /**
   * Perform
   *
   * @returns {Promise<*>}
   */
  async perform() {
    const oThis = this;

    const completeUrl = GITHUB_API_URL + '/login/oauth/access_token';

    const githubRequestParams = {
      requestType: 'POST',
      completeUrl: completeUrl,
      requestParams: {
        client_id: coreConstants.PA_GITHUB_CLIENT_ID,
        client_secret: coreConstants.PA_GITHUB_CLIENT_SECRET,
        code: oThis.githubAuthorizationCode,
        redirect_uri: coreConstants.GITHUB_REDIRECT_URI
      }
    };

    const response = await oThis._fireRequest(githubRequestParams);

    console.log('response ==========', response);

    return oThis._parseJsonResponse(response.data);
  }
}

module.exports = GetAccessToken;
