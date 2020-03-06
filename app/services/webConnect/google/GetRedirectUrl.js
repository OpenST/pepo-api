const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  socialConnectServiceTypeConstants = require(rootPrefix + '/lib/globalConstant/socialConnectServiceType');

/**
 * Class for getting google redirect url.
 *
 * @class GetGoogleRedirectUrl
 */
class GetGoogleRedirectUrl extends ServiceBase {
  /**
   * Constructor for getting google redirect url.
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
      scope: 'email profile openid',
      access_type: 'offline',
      response_type: 'code',
      redirect_uri: basicHelper.getLoginRedirectUrl(
        oThis.isDevLogin,
        socialConnectServiceTypeConstants.googleSocialConnect
      ),
      client_id: coreConstants.GOOGLE_CLIENT_ID
    };

    const googleRedirectUrl = basicHelper.generateUrl(coreConstants.GOOGLE_OAUTH_URL, urlParams);

    return responseHelper.successWithData({
      [entityTypeConstants.redirectUrl]: {
        url: googleRedirectUrl
      }
    });
  }
}

module.exports = GetGoogleRedirectUrl;
