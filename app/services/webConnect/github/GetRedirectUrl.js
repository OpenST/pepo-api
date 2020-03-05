const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  responseEntity = require(rootPrefix + '/lib/globalConstant/responseEntityKey'),
  socialConnectServiceTypeConstants = require(rootPrefix + '/lib/globalConstant/socialConnectServiceType');

/**
 * Class for getting Github redirect Url
 *
 * @class GetGithubRedirectUrl
 */
class GetGithubRedirectUrl extends ServiceBase {
  /**
   * Constructor for getting Github redirect Url
   *
   * @param {object} params
   * @param {string} params.invite
   * @param {boolean} params.dev_login
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.inviteCode = params.invite;
    oThis.isDevLogin = params.dev_login;
  }

  /**
   * Get twitter request token
   *
   * @returns {Promise<unknown>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    let dataCookieValue = oThis.inviteCode
      ? JSON.stringify({
          i: oThis.inviteCode
        })
      : null;

    const urlParams = {
      client_id: coreConstants.PA_GITHUB_CLIENT_ID,
      redirect_uri: basicHelper.getLoginRedirectUrl(
        oThis.isDevLogin,
        socialConnectServiceTypeConstants.githubSocialConnect
      ),
      response_type: 'code',
      scope: 'read:user user:email'
    };

    let githubRedirectUrl = basicHelper.generateUrl(coreConstants.GITHUB_OAUTH_URL, urlParams);

    return Promise.resolve(
      responseHelper.successWithData({
        [responseEntity.redirectUrl]: githubRedirectUrl,
        dataCookieValue: dataCookieValue
      })
    );
  }
}

module.exports = GetGithubRedirectUrl;
