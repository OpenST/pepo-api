const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  GetAccessToken = require(rootPrefix + '/lib/connect/wrappers/github/GetAccessToken'),
  GithubConnectService = require(rootPrefix + '/app/services/connect/Github'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

/**
 * Class for github token verification from web.
 *
 * @class GithubConnectVerify
 */
class GithubConnectVerify extends ServiceBase {
  /**
   * Constructor github token verification from web.
   *
   * @param {object} params
   * @param {string} params.authorization_code
   * @param {string} params.invite_code
   * @param {string} params.api_source
   * @param {object} params.utm_params
   * @param {boolean} params.dev_login
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
    oThis.apiSource = params.api_source;
    oThis.isDevLogin = params.dev_login;

    oThis.githubRespData = null;
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

    const githubResp = await new GetAccessToken({
      code: oThis.authorizationCode,
      isDevLogin: oThis.isDevLogin
    }).perform();

    logger.log('githubResp =====', githubResp);
    if (githubResp.isFailure()) {
      return Promise.reject(githubResp);
    }

    oThis.accessToken = githubResp.data.accessToken;

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

    logger.log('Start::GithubConnectVerify');

    oThis.serviceResponse = await new GithubConnectService({
      access_token: oThis.accessToken,
      invite_code: oThis.inviteCode,
      utm_params: oThis.utmParams,
      api_source: oThis.apiSource
    }).perform();

    if (oThis.serviceResponse.isFailure()) {
      return Promise.reject(oThis.serviceResponse);
    }

    logger.log('End::GithubConnectVerify');
  }
}

module.exports = GithubConnectVerify;
