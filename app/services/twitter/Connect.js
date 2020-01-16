const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  TwitterUserByTwitterIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByTwitterIds'),
  AccountTwitterRequestClass = require(rootPrefix + '/lib/connect/wrappers/twitter/oAuth1.0/Account'),
  PreLaunchInviteByTwitterIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/PreLaunchInviteByTwitterIds'),
  PreLaunchInviteByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/PreLaunchInviteByIds'),
  ReplayAttackCache = require(rootPrefix + '/lib/cacheManagement/single/ReplayAttackOnTwitterConnect'),
  SignupTwitterClass = require(rootPrefix + '/app/services/twitter/Signup'),
  LoginTwitterClass = require(rootPrefix + '/app/services/twitter/Login'),
  gotoFactory = require(rootPrefix + '/lib/goTo/factory'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  preLaunchInviteConstants = require(rootPrefix + '/lib/globalConstant/preLaunchInvite'),
  InviteCodeCache = require(rootPrefix + '/lib/cacheManagement/single/InviteCodeByCode'),
  InviteCodeByIdCache = require(rootPrefix + '/lib/cacheManagement/single/InviteCodeById'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  gotoConstants = require(rootPrefix + '/lib/globalConstant/goto'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

const urlParser = require('url');

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
   * @param {object} [params.utm_params]: utm_params
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
    oThis.utmParams = params.utm_params;

    oThis.failedDueToKnownReason = false;
    oThis.userTwitterEntity = null;
    oThis.twitterUserObj = null;
    oThis.serviceResp = null;
    oThis.inviterCodeObj = null;
    oThis.prelaunchInviteObj = null;
    oThis.twitterRespHeaders = null;
  }

  /**
   * Perform: Perform user creation.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateDuplicateRequest();

    await oThis._fetchTwitterUserAndValidateAccess();

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
   * Fetch Twitter User Obj if present, and if signup then validate its access to Pepo.
   *
   * @sets oThis.twitterUserObj
   *
   * @return {Promise<Result>}
   * @private
   */
  async _fetchTwitterUserAndValidateAccess() {
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
      await oThis._validateUserSignupAllowed();
    }

    logger.log('End::Fetch Twitter User');
    return responseHelper.successWithData({});
  }

  /**
   * Validate user signup is allowed or not.
   *
   * @return {Promise<Result/void>}
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
        let cacheResp = await new InviteCodeByIdCache({ id: oThis.prelaunchInviteObj.inviterCodeId }).fetch();
        oThis.inviterCodeObj = cacheResp.data;
      } else {
        await oThis._validateInviteCode();
      }
    } else if (oThis.inviteCode) {
      // Validate invite code for users, who don't have prelaunch access
      const inviteValidationResp = await oThis._validateInviteCode();
      if (inviteValidationResp.isFailure()) {
        return Promise.reject(inviteValidationResp);
      }
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
   * @returns {Promise<never>}
   * @private
   */
  async _fetchInviterCodeObject() {
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

    return cacheResp.data[oThis.inviteCode];
  }

  /**
   * validate and sanitize invite code. Invite code can be a url or just an invite code.
   *
   * @returns {Promise<*|result>}
   * @private
   */
  _validateAndSanitizeInviteCode() {
    const oThis = this;

    if (CommonValidators.validateNonEmptyUrl(oThis.inviteCode)) {
      let parsedUrl = urlParser.parse(oThis.inviteCode, true);

      if (!CommonValidators.validateNonEmptyObject(parsedUrl) || !['http:', 'https:'].includes(parsedUrl.protocol)) {
        return responseHelper.paramValidationError({
          internal_error_identifier: 's_t_c_vic_8',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_invite_code'],
          debug_options: { parsedUrl: JSON.stringify(parsedUrl) }
        });
      }

      if (coreConstants.PA_DOMAIN.match(parsedUrl.host)) {
        oThis.inviteCode = parsedUrl.query.invite;
      } else if (coreConstants.PA_INVITE_DOMAIN.match(parsedUrl.host)) {
        if (parsedUrl.pathname.split('/').length > 2) {
          oThis.failedDueToKnownReason = true;

          return responseHelper.successWithData({});
        }

        oThis.inviteCode = parsedUrl.pathname.split('/')[1];
      } else {
        return responseHelper.paramValidationError({
          internal_error_identifier: 's_t_c_vic_9',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_invite_code'],
          debug_options: { parsedUrl: JSON.stringify(parsedUrl) }
        });
      }
    }

    if (!CommonValidators.validateInviteCode(oThis.inviteCode)) {
      return responseHelper.paramValidationError({
        internal_error_identifier: 's_t_c_vic_6',
        api_error_identifier: 'invalid_api_params',
        params_error_identifiers: ['invalid_invite_code']
      });
    }

    oThis.inviteCode = oThis.inviteCode.toUpperCase();
    logger.log('The invite code is : ', oThis.inviteCode);
    return responseHelper.successWithData({});
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
      return responseHelper.paramValidationError({
        internal_error_identifier: 's_t_c_vic_1',
        api_error_identifier: 'invalid_api_params',
        params_error_identifiers: ['missing_invite_code']
      });
    }

    let validateResponse = oThis._validateAndSanitizeInviteCode();

    if (validateResponse.isFailure()) {
      return validateResponse;
    }

    if (oThis.failedDueToKnownReason) {
      return responseHelper.successWithData({});
    }

    let inviterCodeRow = await oThis._fetchInviterCodeObject();
    logger.log('The inviterCodeRow is : ', inviterCodeRow);

    // Invite code used is not present
    if (!inviterCodeRow || !inviterCodeRow.id) {
      return responseHelper.paramValidationError({
        internal_error_identifier: 's_t_c_vic_2',
        api_error_identifier: 'invalid_api_params',
        params_error_identifiers: ['invalid_invite_code']
      });
    }

    // If there is number of invites limit on invite code, and it has been reached
    if (inviterCodeRow.inviteLimit >= 0 && inviterCodeRow.inviteLimit <= inviterCodeRow.invitedUserCount) {
      return responseHelper.paramValidationError({
        internal_error_identifier: 's_t_c_vic_3',
        api_error_identifier: 'invalid_api_params',
        params_error_identifiers: ['expired_invite_code']
      });
    }

    //To prevent PreLaunch Users from using his own invite code
    if (oThis.prelaunchInviteObj && oThis.prelaunchInviteObj.inviteCodeId == inviterCodeRow.id) {
      return responseHelper.paramValidationError({
        internal_error_identifier: 's_t_c_vic_4',
        api_error_identifier: 'invalid_api_params',
        params_error_identifiers: ['invalid_invite_code']
      });
    }

    oThis.inviterCodeObj = inviterCodeRow;

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

    twitterResp = await new AccountTwitterRequestClass().verifyCredentials({
      oAuthToken: oThis.token,
      oAuthTokenSecret: oThis.secret
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

    oThis.twitterRespHeaders = twitterResp.data.headers;

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
      twitterRespHeaders: oThis.twitterRespHeaders,
      token: oThis.token,
      secret: oThis.secret
    };

    if (oThis._isUserSignup()) {
      logger.log('Twitter::Connect signup');
      if (oThis.inviterCodeObj) {
        requestParams.inviterCodeId = oThis.inviterCodeObj.id;
      }
      requestParams.prelaunchInviteObj = oThis.prelaunchInviteObj;
      requestParams.utmParams = oThis.utmParams;
      requestParams.inviteCode = oThis.inviteCode || '';
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
    if (oThis.twitterUserObj && oThis.twitterUserObj.userId) {
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
  async _sendFlowCompleteGoto(response) {
    const oThis = this;

    if (response.isSuccess()) {
      response.data[entityType.goto] = { pn: null, v: null };
      if (response.data.openEmailAddFlow) {
        response.data[entityType.goto] = gotoFactory.gotoFor(gotoConstants.addEmailScreenGotoKind);
      }
    }

    return response;
  }
}

module.exports = TwitterConnect;
