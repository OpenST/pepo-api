const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

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
      scope: 'https://www.googleapis.com/auth/plus.login https://www.googleapis.com/auth/plus.profile.emails.read',
      access_type: 'offline',
      response_type: 'code',
      redirect_uri: coreConstants.PA_DOMAIN + '/webview/google/oauth',
      client_id: coreConstants.GOOGLE_CLIENT_ID
    };

    let googleRedirectUrl = basicHelper.generateUrl(coreConstants.GOOGLE_OAUTH_URL, urlParams);

    return Promise.resolve(
      responseHelper.successWithData({
        googleRedirectUrl: googleRedirectUrl,
        dataCookieValue: dataCookieValue
      })
    );
  }
}

module.exports = GetGoogleRedirectUrl;
