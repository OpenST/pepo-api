const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  LoginTwitterClass = require(rootPrefix + '/app/services/preLaunchInvite/Login'),
  SignupTwitterClass = require(rootPrefix + '/app/services/preLaunchInvite/Signup'),
  AccountTwitterRequestClass = require(rootPrefix + '/lib/socialConnect/twitter/oAuth1.0/Account'),
  ReplayAttackCache = require(rootPrefix + '/lib/cacheManagement/single/ReplayAttackOnTwitterConnect'),
  TwitterUserByTwitterIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByTwitterIds'),
  PreLaunchInviteByTwitterIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/PreLaunchInviteByTwitterIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

/**
 * Class for prelaunch invite twitter connect.
 *
 * @class PreLaunchTwitterConnect
 */
class PreLaunchTwitterConnect extends ServiceBase {
  /**
   * Constructor for prelaunch invite twitter connect.
   *
   * @param {object} params
   * @param {string} params.token: oAuth Token
   * @param {string} params.secret: oAuth Secret
   * @param {string} params.twitter_id: Twitter_id
   * @param {string} params.handle: Handle
   * @param {string} [params.invite_code]: invite code
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.token = params.token;
    oThis.secret = params.secret;
    oThis.twitterId = params.twitter_id;
    oThis.handle = params.handle;
    oThis.inviteCode = params.invite_code;

    oThis.userTwitterEntity = null;
    oThis.preLaunchInviteId = null;
    oThis.serviceResp = null;
  }

  /**
   * Async perform.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateDuplicateRequest();

    await oThis._fetchPreLaunchInvitesAndValidateCredentials();

    await oThis._performAction();

    return oThis.serviceResp;
  }

  /**
   * Allow the api only if not recently used within 1 sec.
   *
   * @return {Promise<*>}
   * @private
   */
  async _validateDuplicateRequest() {
    const oThis = this;

    logger.log('Start::_validateDuplicateRequest');

    // Note: Reusing the same cache as in User Login.
    const TwitterConnectOnTwitterIdResp = await new ReplayAttackCache({ twitterId: oThis.twitterId }).fetch();

    if (TwitterConnectOnTwitterIdResp.isFailure()) {
      return Promise.reject(TwitterConnectOnTwitterIdResp);
    }

    if (TwitterConnectOnTwitterIdResp.data > 1) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_pli_c_vdr_1',
          api_error_identifier: 'could_not_proceed'
        })
      );
    }

    logger.log('End::_validateDuplicateRequest');
  }

  /**
   * Fetch twitter user obj if present and validate credentials.
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchPreLaunchInvitesAndValidateCredentials() {
    const oThis = this;

    logger.log('Start::PreLaunchInvites And Validate Credentials');

    const promisesArray = [oThis._fetchPreLaunchInvite(), oThis._validateTwitterCredentials()];
    await Promise.all(promisesArray);

    logger.log('End::PreLaunchInvites And Validate Credentials');
  }

  /**
   * Fetch prelaunch invite.
   *
   * @sets oThis.preLaunchInviteId
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchPreLaunchInvite() {
    const oThis = this;

    logger.log('Start::Fetch PreLaunchInvite');

    const preLaunchInviteObjCacheResp = await new PreLaunchInviteByTwitterIdsCache({
      twitterIds: [oThis.twitterId]
    }).fetch();
    if (preLaunchInviteObjCacheResp.isFailure()) {
      return Promise.reject(preLaunchInviteObjCacheResp);
    }

    if (preLaunchInviteObjCacheResp.data[oThis.twitterId].id) {
      oThis.preLaunchInviteId = preLaunchInviteObjCacheResp.data[oThis.twitterId].id;
    }

    logger.log('End::Fetch PreLaunchInvite');
  }

  /**
   * Verify credentials and get profile data from twitter.
   *
   * @sets oThis.userTwitterEntity
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validateTwitterCredentials() {
    const oThis = this;

    logger.log('Start::Validate Twitter Credentials');

    const twitterResp = await new AccountTwitterRequestClass().verifyCredentials({
      oAuthToken: oThis.token,
      oAuthTokenSecret: oThis.secret
    });

    if (twitterResp.isFailure()) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_pli_c_vtc_2',
          api_error_identifier: 'unauthorized_api_request',
          debug_options: {}
        })
      );
    }

    oThis.userTwitterEntity = twitterResp.data.userEntity;

    // Validating the front end data.
    if (oThis.userTwitterEntity.idStr !== oThis.twitterId || oThis.userTwitterEntity.handle !== oThis.handle) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_pli_c_vtc_3',
          api_error_identifier: 'unauthorized_api_request',
          debug_options: {}
        })
      );
    }

    logger.log('End::Validate Twitter Credentials');
  }

  /**
   * Call sign-up or login service as needed for twitter connect.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _performAction() {
    const oThis = this;

    logger.log('Start::PreLaunchTwitterConnect._performAction');

    const requestParams = {
      preLaunchInviteId: oThis.preLaunchInviteId,
      userTwitterEntity: oThis.userTwitterEntity,
      token: oThis.token,
      secret: oThis.secret,
      inviteCode: oThis.inviteCode
    };

    if (oThis.preLaunchInviteId) {
      logger.log('Twitter::PreLaunchTwitterConnect login');
      oThis.serviceResp = await new LoginTwitterClass(requestParams).perform();
      if (!oThis.serviceResp.isFailure()) {
        oThis.serviceResp.data.newSignup = 0;
      }
    } else {
      logger.log('Twitter::PreLaunchTwitterConnect signup');

      await oThis._validateIfUserIsExistingAppUser();

      oThis.serviceResp = await new SignupTwitterClass(requestParams).perform();
      if (!oThis.serviceResp.isFailure()) {
        oThis.serviceResp.data.newSignup = 1;
      }
    }

    logger.log('End::PreLaunchTwitterConnect._performAction');
  }

  /**
   * Validate if user is not already an existing application user.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validateIfUserIsExistingAppUser() {
    const oThis = this;

    const twitterUserCacheResponse = await new TwitterUserByTwitterIdsCache({
      twitterIds: [oThis.twitterId]
    }).fetch();
    if (twitterUserCacheResponse.isFailure()) {
      return Promise.reject(twitterUserCacheResponse);
    }

    const twitterUserData = twitterUserCacheResponse.data[oThis.twitterId];
    if (twitterUserData && twitterUserData.userId) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_pli_c_viueau_1',
          api_error_identifier: 'already_registered_in_app',
          debug_options: {}
        })
      );
    }
  }
}

module.exports = PreLaunchTwitterConnect;
