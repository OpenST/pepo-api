/**
 * Google access token.
 *
 * @module lib/connect/wrappers/google/GetAccessToken
 */
const rootPrefix = '../../../..',
  GithubAuthBase = require(rootPrefix + '/lib/connect/wrappers/github/Base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  socialConnectServiceTypeConstants = require(rootPrefix + '/lib/globalConstant/socialConnectServiceType'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

const GITHUB_API_URL = 'https://github.com';

class GetAccessToken extends GithubAuthBase {
  constructor(params) {
    super(params);
    const oThis = this;
    oThis.githubAuthorizationCode = params.code;
    oThis.isDevLogin = params.isDevLogin;
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
        code: oThis.githubAuthorizationCode
        // ,redirect_uri: basicHelper.getLoginRedirectUrl(
        //   oThis.isDevLogin,
        //   socialConnectServiceTypeConstants.githubSocialConnect
        // )
      }
    };

    console.log('completeUrl =====', completeUrl);
    console.log('githubRequestParams =====', githubRequestParams);

    const response = await oThis._fireRequest(githubRequestParams);

    if (response.isFailure()) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_c_w_gh_gat_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { response: response }
        })
      );
    }

    const responseData = response.data.responseData;

    if (responseData.includes('error=')) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_c_w_gh_gat_2',
          api_error_identifier: 'something_went_wrong',
          debug_options: { response: responseData }
        })
      );
    }

    const githubAccessToken = oThis._getAccessToken(responseData);
    logger.log('githubAccessToken ======', githubAccessToken);
    return responseHelper.successWithData({ accessToken: githubAccessToken });
  }

  /**
   * Get access token from resp.
   *
   * @param {String} accessTokenResp eg: 'access_token=4675456672526b155c0501cfea9566c2f2256c7b&amp;scope=read%3Auser%2Cuser%3Aemail&amp;token_type=bearer'
   * @returns {string}
   * @private
   */
  _getAccessToken(accessTokenResp) {
    let splitResp = accessTokenResp.split('&amp;');

    for (let i = 0; i < splitResp.length; i++) {
      if (splitResp[i].includes('access_token=')) {
        return splitResp[i].replace('access_token=', '');
      }
    }
  }
}

module.exports = GetAccessToken;
