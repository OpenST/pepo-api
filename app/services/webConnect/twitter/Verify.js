const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  TwitterConnectService = require(rootPrefix + '/app/services/connect/Twitter'),
  TwitterAuthTokenModel = require(rootPrefix + '/app/models/mysql/TwitterAuthToken'),
  AuthorizationTwitterRequestClass = require(rootPrefix + '/lib/connect/wrappers/twitter/oAuth1.0/Authorization'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  twitterAuthTokenConstants = require(rootPrefix + '/lib/globalConstant/twitterAuthToken');

/**
 * Class for twitter verification.
 *
 * @class TwitterVerify
 */
class TwitterVerify extends ServiceBase {
  /**
   * Constructor for twitter prelaunch verification.
   *
   * @param {object} params
   * @param {string} params.invite_code
   * @param {string} params.oauth_token
   * @param {string} params.oauth_verifier
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

    oThis.oauthToken = params.oauth_token;
    oThis.oauthVerifier = params.oauth_verifier;
    oThis.inviteCode = params.invite_code;
    oThis.utmParams = params.utm_params;
    oThis.apiSource = params.api_source;
    oThis.isDevLogin = params.dev_login;

    oThis.oAuthTokenSecret = null;
    oThis.twitterAuthTokenObj = null;
    oThis.twitterAuthTokenObj = {};
    oThis.twitterRespData = null;
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

    await oThis._validateOauthToken();

    await oThis._fetchAccessToken();

    await oThis._updateTwitterAuthToken();

    await oThis._connect();

    return oThis.serviceResponse;
  }

  /**
   * Get and validate OauthToken.
   *
   * @sets oThis.twitterAuthTokenObj
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validateOauthToken() {
    const oThis = this;

    oThis.twitterAuthTokenObj = await new TwitterAuthTokenModel().fetchByToken(oThis.oauthToken);

    if (!oThis.twitterAuthTokenObj.id || oThis.twitterAuthTokenObj.status !== twitterAuthTokenConstants.activeStatus) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_c_t_v_1',
          api_error_identifier: 'unauthorized_api_request',
          debug_options: {}
        })
      );
    }

    oThis.oAuthTokenSecret = oThis.twitterAuthTokenObj.secret;
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

    const reqParams = {
      oAuthToken: oThis.oauthToken,
      oAuthTokenSecret: oThis.oAuthTokenSecret,
      oAuthVerifier: oThis.oauthVerifier
    };

    const twitterResp = await new AuthorizationTwitterRequestClass({ isDevLogin: oThis.isDevLogin }).accessToken(
      reqParams
    );

    if (twitterResp.isFailure()) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_c_t_v_2',
          api_error_identifier: 'something_went_wrong',
          debug_options: {}
        })
      );
    }

    oThis.twitterRespData = twitterResp.data;

    logger.log('End::_fetchAccessToken');
  }

  /**
   * Update OauthToken status.
   *
   * @sets oThis.twitterAuthTokenObj
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateTwitterAuthToken() {
    const oThis = this;

    await new TwitterAuthTokenModel()
      .update({
        status: twitterAuthTokenConstants.invertedStatuses[twitterAuthTokenConstants.inactiveStatus]
      })
      .where({ id: oThis.twitterAuthTokenObj.id })
      .fire();

    oThis.twitterAuthTokenObj.status = twitterAuthTokenConstants.inactiveStatus;
  }

  /**
   * Call sign-up or login service as needed for twitter connect.
   *
   * @sets oThis.serviceResponse
   *
   * @returns {void}
   * @private
   */
  async _connect() {
    const oThis = this;

    logger.log('Start::TwitterVerify._connect');

    oThis.serviceResponse = await new TwitterConnectService({
      token: oThis.twitterRespData.oAuthToken,
      secret: oThis.twitterRespData.oAuthTokenSecret,
      twitter_id: oThis.twitterRespData.userId,
      handle: oThis.twitterRespData.screenName,
      invite_code: oThis.inviteCode,
      utm_params: oThis.utmParams,
      api_source: oThis.apiSource
    }).perform();

    if (oThis.serviceResponse.isFailure()) {
      return Promise.reject(oThis.serviceResponse);
    }

    logger.log('End::TwitterVerify._connect');
  }
}

module.exports = TwitterVerify;
