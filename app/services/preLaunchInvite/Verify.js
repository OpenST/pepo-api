const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  TwitterAuthTokenModel = require(rootPrefix + '/app/models/mysql/TwitterAuthToken'),
  ConnectService = require(rootPrefix + '/app/services/preLaunchInvite/Connect'),
  AuthorizationTwitterRequestClass = require(rootPrefix + '/lib/twitter/oAuth1.0/Authorization'),
  twitterAuthTokenConstants = require(rootPrefix + '/lib/globalConstant/twitterAuthToken'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

/**
 * Class for Twitter PreLaunchTwitterConnect for Pre Launch Invite.
 *
 * @class PreLaunchTwitterVerify
 */
class PreLaunchTwitterVerify extends ServiceBase {
  /**
   * Constructor for Verify Twitter Login service.
   *
   * @param {object} params
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.inviteCode = params.i;
    oThis.oauthToken = params.oauth_token;
    oThis.oautVerifier = params.oauth_verifier;

    oThis.oAuthTokenSecret = null;
    oThis.twitterAuthTokenObj = null;
    oThis.twitterAuthTokenObj = {};
    oThis.twitterRespData = null;

    oThis.serviceResponse = null;
  }

  /**
   * Perform: Perform user creation.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateOauthToken();

    await oThis._fetchAccessToken();

    await oThis._updateTwitterAuthToken();

    await oThis._connect();

    return Promise.resolve(oThis.serviceResponse);
  }

  /**
   * get and validate OauthToken
   *
   * @sets oThis.twitterAuthTokenObj
   *
   * @return {Promise<Result>}
   * @private
   */
  async _validateOauthToken() {
    const oThis = this;

    oThis.twitterAuthTokenObj = await new TwitterAuthTokenModel().fetchByToken(oThis.oauthToken);

    if (!oThis.twitterAuthTokenObj.id || oThis.twitterAuthTokenObj.status != twitterAuthTokenConstants.activeStatus) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_pli_v_vot_1',
          api_error_identifier: 'unauthorized_api_request',
          debug_options: {}
        })
      );
    }

    oThis.oAuthTokenSecret = oThis.twitterAuthTokenObj.secret;

    return responseHelper.successWithData({});
  }

  /**
   * Verify Credentials from twitter.
   *
   * @sets oThis.userTwitterEntity
   *
   * @return {Promise<Result>}
   * @private
   */
  async _fetchAccessToken() {
    const oThis = this;
    logger.log('Start::_fetchAccessToken');

    let twitterResp = null;

    let reqParams = {
      oAuthToken: oThis.oauthToken,
      oAuthTokenSecret: oThis.oAuthTokenSecret,
      oAuthVerifier: oThis.oautVerifier
    };

    twitterResp = await new AuthorizationTwitterRequestClass().accessToken(reqParams);

    if (twitterResp.isFailure()) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_pli_v_vtc_2',
          api_error_identifier: 'something_went_wrong',
          debug_options: {}
        })
      );
    }

    oThis.twitterRespData = twitterResp.data;

    logger.log('End::_fetchAccessToken');

    return responseHelper.successWithData({});
  }

  /**
   * update OauthToken status
   *
   * @sets oThis.twitterAuthTokenObj
   *
   * @return {Promise<Result>}
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
    return responseHelper.successWithData({});
  }

  /**
   * Call signup or login service as needed for twitter connect.
   *
   * @return {void}
   *
   * @private
   */
  async _connect() {
    const oThis = this;
    logger.log('Start::PreLaunchTwitterConnect._connect');

    let obj = new ConnectService({
      token: oThis.twitterRespData.oAuthToken,
      secret: oThis.twitterRespData.oAuthTokenSecret,
      twitter_id: oThis.twitterRespData.userId,
      handle: oThis.twitterRespData.screenName,
      invite_code: oThis.inviteCode
    });

    oThis.serviceResponse = await obj.perform();

    if (oThis.serviceResponse.isFailure()) {
      return Promise.reject(oThis.serviceResponse);
    }

    logger.log('End::PreLaunchTwitterConnect._connect');
  }
}

module.exports = PreLaunchTwitterVerify;
