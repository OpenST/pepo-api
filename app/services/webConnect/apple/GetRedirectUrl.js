const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  socialConnectServiceTypeConstants = require(rootPrefix + '/lib/globalConstant/socialConnectServiceType');

/**
 * Class for getting apple redirect url.
 *
 * @class GetAppleRedirectUrl
 */
class GetAppleRedirectUrl extends ServiceBase {
  /**
   * Constructor for getting apple redirect url.
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
      client_id: coreConstants.PA_APPLE_WEB_SERVICE_ID,
      redirect_uri: basicHelper.getLoginRedirectUrl(
        oThis.isDevLogin,
        socialConnectServiceTypeConstants.appleSocialConnect
      ),
      response_type: 'code id_token',
      scope: 'email name',
      response_mode: 'form_post'
    };

    const appleRedirectUrl = basicHelper.generateUrl(coreConstants.APPLE_OAUTH_URL, urlParams);

    return responseHelper.successWithData({
      [entityTypeConstants.redirectUrl]: {
        url: appleRedirectUrl
      }
    });
  }
}

module.exports = GetAppleRedirectUrl;
