const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  GetAccessToken = require(rootPrefix + '/lib/connect/wrappers/google/GetAccessToken'),
  GoogleConnectService = require(rootPrefix + '/app/services/connect/Google'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

/**
 * Class for google token verification from web.
 *
 * @class GoogleConnectVerify
 */
class GoogleConnectVerify extends ServiceBase {
  /**
   * Constructor google token verification from web.
   *
   * @param {object} params
   * @param {string} params.authorization_code
   * @param {string} params.invite_code
   * @param {string} params.api_referer
   * @param {object} params.utm_params
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;
    oThis.authorizationCode = params.authorization_code;
    oThis.inviteCode = params.invite_code;
    oThis.utmParams = params.utm_params;
    oThis.apiReferer = params.api_referer;

    oThis.googleRespData = null;
    oThis.serviceResponse = null;
  }

  /**
   * Async perform.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchAccessToken();

    await oThis._connect();

    return oThis.serviceResponse;
  }

  /**
   * Verify credentials from twitter.
   *
   * @sets oThis.userTwitterEntity
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchAccessToken() {
    const oThis = this;

    logger.log('Start::_fetchAccessToken');

    const googleResp = await new GetAccessToken({ code: oThis.authorizationCode }).perform();

    if (googleResp.isFailure()) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_wc_g_v_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: {}
        })
      );
    }

    oThis.googleRespData = googleResp.data;

    logger.log('End::_fetchAccessToken');
  }

  /**
   * Call sign-up or login service as needed for google connect.
   *
   * @sets oThis.serviceResponse
   *
   * @returns {void}
   * @private
   */
  async _connect() {
    const oThis = this;

    logger.log('Start::GoogleConnectVerify');

    oThis.serviceResponse = await new GoogleConnectService({
      access_token: oThis.googleRespData.access_token,
      invite_code: oThis.inviteCode,
      utm_params: oThis.utmParams,
      api_referer: oThis.apiReferer
    }).perform();

    if (oThis.serviceResponse.isFailure()) {
      return Promise.reject(oThis.serviceResponse);
    }

    logger.log('End::GoogleConnectVerify');
  }
}

module.exports = GoogleConnectVerify;
