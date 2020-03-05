const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseEntity = require(rootPrefix + '/lib/globalConstant/responseEntityKey'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  socialConnectServiceTypeConstants = require(rootPrefix + '/lib/globalConstant/socialConnectServiceType');

/**
 * Class for getting Google redirect Url
 *
 * @class GetGoogleRedirectUrl
 */
class GetGoogleRedirectUrl extends ServiceBase {
  /**
   * Constructor for getting Google redirect Url
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
      scope: 'https://www.googleapis.com/auth/plus.login https://www.googleapis.com/auth/plus.profile.emails.read',
      access_type: 'offline',
      response_type: 'code',
      redirect_uri: basicHelper.getLoginRedirectUrl(
        oThis.isDevLogin,
        socialConnectServiceTypeConstants.googleSocialConnect
      ),
      client_id: coreConstants.GOOGLE_CLIENT_ID
    };

    let googleRedirectUrl = basicHelper.generateUrl(coreConstants.GOOGLE_OAUTH_URL, urlParams);

    return Promise.resolve(
      responseHelper.successWithData({
        [responseEntity.redirectUrl]: googleRedirectUrl,
        dataCookieValue: dataCookieValue
      })
    );
  }
}

module.exports = GetGoogleRedirectUrl;
