const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  responseEntity = require(rootPrefix + '/lib/globalConstant/responseEntityKey');

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
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.inviteCode = params.invite;
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
      redirect_uri: coreConstants.PA_DOMAIN + '/webview/github/oauth',
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
