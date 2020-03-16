const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  socialConnectServiceTypeConstants = require(rootPrefix + '/lib/globalConstant/socialConnectServiceType');

/**
 * Class for getting github redirect url.
 *
 * @class GetGithubRedirectUrl
 */
class GetGithubRedirectUrl extends ServiceBase {
  /**
   * Constructor for getting github redirect url.
   *
   * @param {object} params
   * @param {boolean} params.dev_login
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.isDevLogin = params.dev_login;
    oThis.state = params.state;
  }

  /**
   * Async perform.
   *
   * @returns {Promise<unknown>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    const urlParams = {
      client_id: coreConstants.PA_GITHUB_CLIENT_ID,
      redirect_uri: basicHelper.getLoginRedirectUrl(
        oThis.isDevLogin,
        socialConnectServiceTypeConstants.githubSocialConnect
      ),
      response_type: 'code',
      scope: 'read:user user:email',
      state: oThis.state
    };

    const githubRedirectUrl = basicHelper.generateUrl(coreConstants.GITHUB_OAUTH_URL, urlParams);

    return responseHelper.successWithData({
      [entityTypeConstants.redirectUrl]: {
        url: githubRedirectUrl
      }
    });
  }
}

module.exports = GetGithubRedirectUrl;
