const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  TwitterUserByTwitterIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByTwitterIds'),
  AccountTwitterRequestClass = require(rootPrefix + '/lib/twitter/oAuth1.0/Account'),
  PreLaunchInviteByTwitterIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/PreLaunchInviteByTwitterIds'),
  PreLaunchInviteByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/PreLaunchInviteByIds'),
  ReplayAttackCache = require(rootPrefix + '/lib/cacheManagement/single/ReplayAttackOnTwitterConnect'),
  SignupTwitterClass = require(rootPrefix + '/app/services/twitter/Signup'),
  LoginTwitterClass = require(rootPrefix + '/app/services/twitter/Login'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  preLaunchInviteConstants = require(rootPrefix + '/lib/globalConstant/preLaunchInvite'),
  InviteCodeCache = require(rootPrefix + '/lib/cacheManagement/single/InviteCodeByCode'),
  InviteCodeModel = require(rootPrefix + '/app/models/mysql/InviteCode'),
  inviteCodeConstants = require(rootPrefix + '/lib/globalConstant/inviteCode'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  pageNameConstants = require(rootPrefix + '/lib/globalConstant/pageName'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

/**
 * Class for Twitter Connect service.
 *
 * @class TwitterConnect
 */
class TwitterConnect extends ServiceBase {
  /**
   * Constructor for signup service.
   *
   * @param {object} params
   * @param {string} params.token: oAuth Token
   * @param {string} params.secret: oAuth Secret
   * @param {string} params.twitter_id: Twitter_id
   * @param {string} params.handle: Handle
   *
   * @param {string} [params.invite_code]: invite_code
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
    oThis.twitterUserObj = null;
    oThis.serviceResp = null;
    oThis.inviterCodeObj = null;
    oThis.prelaunchInviteObj = null;
    oThis.couldNotProceed = false;
  }

  /**
   * Perform: Perform user creation.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateDuplicateRequest();

    let resp = await oThis._fetchTwitterUser();
    if (oThis.couldNotProceed) {
      return oThis._sendFlowCompleteGoto(resp);
    }

    await oThis._validateTwitterCredentials();

    await oThis._performAction();

    return oThis._sendFlowCompleteGoto(oThis.serviceResp);
  }

  /**
   * Allow the api only if not recently used within 1 sec
   *
   * @return {Promise<Result>}
   * @private
   */
  async _validateDuplicateRequest() {
    const oThis = this;
    logger.log('Start::_validateDuplicateRequest');

    const TwitterConnectOnTwitterIdResp = await new ReplayAttackCache({ twitterId: oThis.twitterId }).fetch();

    if (TwitterConnectOnTwitterIdResp.isFailure()) {
      return Promise.reject(TwitterConnectOnTwitterIdResp);
    }

    if (TwitterConnectOnTwitterIdResp.data > 1) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_t_c_vdr_1',
          api_error_identifier: 'could_not_proceed'
        })
      );
    }

    logger.log('End::_validateDuplicateRequest');

    return responseHelper.successWithData({});
  }

  /**
   * Fetch Twitter User Obj if present.
   *
   * @sets oThis.twitterUserObj
   *
   * @return {Promise<Result>}
   * @private
   */
  async _fetchTwitterUser() {
    const oThis = this;

    logger.log('Start::Fetch Twitter User');

    const twitterUserObjCacheResp = await new TwitterUserByTwitterIdsCache({ twitterIds: [oThis.twitterId] }).fetch();

    if (twitterUserObjCacheResp.isFailure()) {
      return Promise.reject(twitterUserObjCacheResp);
    }

    if (twitterUserObjCacheResp.data[oThis.twitterId].id) {
      oThis.twitterUserObj = twitterUserObjCacheResp.data[oThis.twitterId];
    }

    if (oThis._isUserSignup()) {
      let resp = await new Promise(function(onResolve, onReject) {
        oThis
          ._validateUserSignupAllowed()
          .then(function(resp) {
            if (resp.isFailure()) {
              oThis.couldNotProceed = true;
            }
            onResolve(resp);
          })
          .catch(function(errorResponse) {
            oThis.couldNotProceed = true;
            onResolve(errorResponse);
          });
      });

      return resp;
    }

    logger.log('End::Fetch Twitter User');
    return responseHelper.successWithData({});
  }

  /**
   * Validate user signup is allowed or not.
   *
   * @return {Promise<Result>}
   * @private
   */
  async _validateUserSignupAllowed() {
    const oThis = this;
    logger.log('Start::Validate User signup allowed');

    let resp = await oThis._fetchPreLaunchInvite();
    oThis.prelaunchInviteObj = resp.data.preLaunchInviteObj;

    // If invite code is required, then check its validity
    if (oThis._hasPrelaunchInvitedAccess()) {
      // If twitter account belongs to prelaunch invite, then use that inviter code if any
      if (oThis.prelaunchInviteObj.inviterCodeId) {
        // TODO: Replace this with cache built by Tejas
        oThis.inviterCodeObj = await new InviteCodeModel().fetchById(oThis.prelaunchInviteObj.inviterCodeId);
      } else {
        // Fetch inviter code object
        await oThis._fetchInviteCodeObject();
      }
    } else {
      await oThis._validateInviteCode();
    }

    logger.log('End::Validate User signup allowed');

    return responseHelper.successWithData({});
  }

  /**
   * Fetch Pre Launch Invite Obj if present.
   *
   *
   * @return {Promise<Result>}
   * @private
   */
  async _fetchPreLaunchInvite() {
    const oThis = this;

    const preLaunchInviteCacheResp = await new PreLaunchInviteByTwitterIdsCache({
      twitterIds: [oThis.twitterId]
    }).fetch();

    if (preLaunchInviteCacheResp.isFailure()) {
      return preLaunchInviteCacheResp;
    }

    let preLaunchInviteObj = null;
    if (preLaunchInviteCacheResp.data[oThis.twitterId].id) {
      let preLaunchInviteId = preLaunchInviteCacheResp.data[oThis.twitterId].id;

      let cacheRsp = await new PreLaunchInviteByIdsCache({ ids: [preLaunchInviteId] }).fetch();

      if (cacheRsp.isFailure()) {
        return cacheRsp;
      }

      preLaunchInviteObj = cacheRsp.data[preLaunchInviteId];
    }

    return responseHelper.successWithData({ preLaunchInviteObj: preLaunchInviteObj });
  }

  /**
   * If twitter user has pre-launch invited access
   *
   * @returns {boolean}
   * @private
   */
  _hasPrelaunchInvitedAccess() {
    const oThis = this;

    let hasPrelaunchAccess = false;

    // If twitter account belongs to prelaunch invite
    if (oThis.prelaunchInviteObj) {
      // If prelaunch invite has been whitelisted by admin
      // OR
      // User has already accepted prelaunch invite of some other user
      if (
        oThis.prelaunchInviteObj.adminStatus == preLaunchInviteConstants.whitelistedStatus ||
        oThis.prelaunchInviteObj.inviterCodeId
      ) {
        hasPrelaunchAccess = true;
      }
    }

    return hasPrelaunchAccess;
  }

  /**
   * Fetch inviter code row from cache
   *
   * Sets @inviterCodeObj
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchInviteCodeObject() {
    const oThis = this;

    let cacheResp = await new InviteCodeCache({ inviteCode: oThis.inviteCode }).fetch();
    // Invite code used is not present
    if (cacheResp.isFailure()) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 's_t_c_vic_2',
          api_error_identifier: 'could_not_proceed',
          params_error_identifiers: ['something_went_wrong'],
          debug_options: {}
        })
      );
    }

    oThis.inviterCodeObj = cacheResp.data[oThis.inviteCode];
  }

  /**
   * Validate invite code passed, in case invite code is mandatory.
   *
   * @Sets oThis.inviterCodeObj
   *
   * @returns {Promise<*>}
   * @private
   */
  async _validateInviteCode() {
    const oThis = this;

    // Invite code is required but not passed
    if (!oThis.inviteCode) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: inviteCodeConstants.missingInviteCodeError,
          api_error_identifier: inviteCodeConstants.missingInviteCodeError
        })
      );
    }

    await oThis._fetchInviteCodeObject();

    // Invite code used is not present
    if (!oThis.inviterCodeObj || !oThis.inviterCodeObj.id) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: inviteCodeConstants.invalidInviteCodeError,
          api_error_identifier: inviteCodeConstants.invalidInviteCodeError
        })
      );
    }

    // If there is number of invites limit on invite code, and it has been reached
    if (
      oThis.inviterCodeObj.inviteLimit > 0 &&
      oThis.inviterCodeObj.inviteLimit <= oThis.inviterCodeObj.invitedUserCount
    ) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: inviteCodeConstants.expiredInviteCodeError,
          api_error_identifier: inviteCodeConstants.expiredInviteCodeError
        })
      );
    }

    return responseHelper.successWithData({});
  }

  /**
   * Verify Credentials and get profile data from twitter.
   *
   * @sets oThis.userTwitterEntity
   *
   * @return {Promise<Result>}
   * @private
   */
  async _validateTwitterCredentials() {
    const oThis = this;
    logger.log('Start::Validate Twitter Credentials');

    let twitterResp = null;

    twitterResp = await new AccountTwitterRequestClass()
      .verifyCredentials({
        oAuthToken: oThis.token,
        oAuthTokenSecret: oThis.secret
      })
      .catch(function(err) {
        logger.error('Error while validate Credentials for twitter: ', err);
        return Promise.reject(
          responseHelper.error({
            internal_error_identifier: 's_t_c_vtc_1',
            api_error_identifier: 'unauthorized_api_request',
            debug_options: {}
          })
        );
      });

    if (twitterResp.isFailure()) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_t_c_vtc_2',
          api_error_identifier: 'unauthorized_api_request',
          debug_options: {}
        })
      );
    }

    oThis.userTwitterEntity = twitterResp.data.userEntity;

    // validating the front end data
    if (oThis.userTwitterEntity.idStr != oThis.twitterId || oThis.userTwitterEntity.handle != oThis.handle) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_t_c_vtc_3',
          api_error_identifier: 'unauthorized_api_request',
          debug_options: {}
        })
      );
    }

    logger.log('End::Validate Twitter Credentials');

    return responseHelper.successWithData({});
  }

  /**
   * Call signup or login service as needed for twitter connect.
   *
   * @return {void}
   *
   * @private
   */
  async _performAction() {
    const oThis = this;
    logger.log('Start::Connect._performAction');

    let requestParams = {
      twitterUserObj: oThis.twitterUserObj,
      userTwitterEntity: oThis.userTwitterEntity,
      token: oThis.token,
      secret: oThis.secret
    };

    if (oThis._isUserSignup()) {
      logger.log('Twitter::Connect signup');
      if (oThis.inviterCodeObj) {
        requestParams.inviterCodeId = oThis.inviterCodeObj.id;
      }
      requestParams.prelaunchInviteObj = oThis.prelaunchInviteObj;
      oThis.serviceResp = await new SignupTwitterClass(requestParams).perform();
    } else {
      logger.log('Twitter::Connect login');
      oThis.serviceResp = await new LoginTwitterClass(requestParams).perform();
    }

    logger.log('End::Connect._performAction');
  }

  /**
   * is signup or login for twitter connect.
   *
   * @return {Boolean}
   *
   * @private
   */
  _isUserSignup() {
    const oThis = this;

    // twitterUserObj may or may not be present.
    // Also if present, it might not be of a Pepo user.
    if (!oThis.twitterUserObj || !oThis.twitterUserObj.userId) {
      return false;
    }

    return true;
  }

  /**
   * Send Goto after the flow completes, either in error or success
   *
   * @param response
   * @private
   */
  _sendFlowCompleteGoto(response) {
    const oThis = this;

    // For some errors, success has to be sent to devices, with GOTO
    if (response.isFailure()) {
      // For these error codes only, success would go with some goto values
      if (
        [
          inviteCodeConstants.invalidInviteCodeError,
          inviteCodeConstants.missingInviteCodeError,
          inviteCodeConstants.expiredInviteCodeError
        ].includes(response.internalErrorCode)
      ) {
        return responseHelper.successWithData({
          overwrittenFailure: 1,
          [entityType.goto]: {
            pn: pageNameConstants.inviteCodePageScreen,
            v: {
              [pageNameConstants.inviteCodeErrorParam]:
                inviteCodeConstants.inviteCodeErrorGotoValues[response.internalErrorCode]
            }
          }
        });
      }
    } else {
      response.data[entityType.goto] = {};
      if (response.data.openEmailAddFlow) {
        // Notify app about email add flow
        response.data[entityType.goto] = {
          pn: pageNameConstants.AddEmailScreen,
          v: {}
        };
      }
    }

    return response;
  }
}

module.exports = TwitterConnect;
