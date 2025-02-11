const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  InviteCodeCache = require(rootPrefix + '/lib/cacheManagement/single/InviteCodeByCode'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  headerHelper = require(rootPrefix + '/helpers/header'),
  gotoFactory = require(rootPrefix + '/lib/goTo/factory'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
  gotoConstants = require(rootPrefix + '/lib/globalConstant/goto'),
  UserIdentifiersByEmailsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserIdentifiersByEmails'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  UserDeviceExtendedDetailModel = require(rootPrefix + '/app/models/mysql/UserDeviceExtendedDetail'),
  UserDeviceExtendedDetailsByDeviceIdsCache = require(rootPrefix +
    '/lib/cacheManagement/multi/UserDeviceExtendedDetailsByDeviceIds'),
  UserStatsByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserStatByUserIds'),
  apiSourceConstants = require(rootPrefix + '/lib/globalConstant/apiSource'),
  ReplayAttackOnSocialConnectCache = require(rootPrefix + '/lib/cacheManagement/single/ReplayAttackOnSocialConnect'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common');

const urlParser = require('url');

/**
 * Base class for all social platform connects
 *
 * @class SocialConnectBase
 */
class SocialConnectBase extends ServiceBase {
  /**
   * Constructor for social platform connects base.
   *
   * @param {object} params
   * @param {string} params.invite_code: invite_code
   * @param {string} params.api_source: api_source
   * @param {string} params.ip_address: ip_address
   * @param {string} params.sanitized_headers: sanitized_headers
   * @param {object} params.utm_params: utm_params
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.inviteCode = params.invite_code;
    oThis.utmParams = params.utm_params;
    oThis.ipAddress = params.ip_address;
    oThis.apiSource = params.api_source;
    oThis.headers = params.sanitized_headers;

    oThis.socialUserObj = null;
    oThis.newSocialConnect = false;
    oThis.userId = null;
    oThis.isUserSignUp = true;
    oThis.serviceResp = null;
    oThis.inviterCodeObj = null;
    oThis.userEmailToSet = null;
  }

  /**
   * Main Perform function
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validateDuplicateRequest();

    await oThis._validateAndFetchSocialInfo();

    await oThis._fetchSocialUser();

    await oThis._verifyUserPresence();

    await oThis._performConnect();

    return oThis._sendFlowCompleteGoto(oThis.serviceResp);
  }

  /**
   * Allow the api only if not recently used within 1 sec
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validateDuplicateRequest() {
    const oThis = this;

    const resp = await new ReplayAttackOnSocialConnectCache({ socialId: oThis.duplicateRequestIdentifier }).fetch();

    if (resp.isFailure()) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_c_b_1',
          api_error_identifier: 'could_not_proceed'
        })
      );
    }

    return responseHelper.successWithData({});
  }

  /**
   * Method to validate access tokens and fetching data from Social platforms.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validateAndFetchSocialInfo() {
    throw 'Sub-class to implement';
  }

  /**
   * Method to fetch data from respective social_users tables
   *
   * @Sets oThis.socialUserObj
   * @returns {Promise<void>}
   * @private
   */
  async _fetchSocialUser() {
    throw 'Sub-class to implement';
  }

  /**
   * Method to check whether social account exists or not.
   *
   * @returns {boolean}
   * @private
   */
  _socialAccountExists() {
    const oThis = this;

    return oThis.socialUserObj && oThis.socialUserObj.userId;
  }

  /**
   * Method to check whether same social platform is connected before.
   *
   * @param userObj
   * @private
   */
  _sameSocialConnectUsed(userObj) {
    // Look for property set in user object.
    throw 'Sub-class to implement';
  }

  /**
   * Method to verify user is already present in system
   *
   * @returns {Promise<void>}
   * @private
   */
  async _verifyUserPresence() {
    const oThis = this;

    // Check social user existence
    if (oThis._socialAccountExists()) {
      oThis.isUserSignUp = false;
      oThis.userId = oThis.socialUserObj.userId;
    } else {
      // If social account is not in our system, then look for unique identifier
      oThis.newSocialConnect = true;

      // Look for user email or phone number already exists.
      // Means user is already part of system using same or different social connect.
      let userIdentifiers = [],
        userUniqueElements = oThis._getSocialUserUniqueProperties();

      if (CommonValidators.validateNonEmptyObject(userUniqueElements)) {
        // Email which can be set for user.
        oThis.userEmailToSet = userUniqueElements.values[0];

        const userIdentifiersByEmailsCacheRsp = await new UserIdentifiersByEmailsCache({
          emails: userUniqueElements.values
        }).fetch();

        if (!userIdentifiersByEmailsCacheRsp || userIdentifiersByEmailsCacheRsp.isFailure()) {
          return Promise.reject(userIdentifiersByEmailsCacheRsp);
        }

        const userIdentifiersByEmailsMap = userIdentifiersByEmailsCacheRsp.data;

        for (let eValue in userIdentifiersByEmailsMap) {
          if (CommonValidators.validateNonEmptyObject(userIdentifiersByEmailsMap[eValue])) {
            userIdentifiers.push(userIdentifiersByEmailsMap[eValue]);
          }
        }
      }

      if (userIdentifiers.length > 0) {
        // This means user email or phone number already exists in system via another or same social platform.
        let userObj = await oThis._decideUserToAssociateNewAccount(userIdentifiers);
        if (!CommonValidators.validateNonEmptyObject(userObj)) {
          // If no user account is found and user identifiers are present
          return Promise.reject(
            responseHelper.error({
              internal_error_identifier: 'a_s_c_b_1',
              api_error_identifier: 'something_went_wrong',
              debug_options: { userIdentifiers: userIdentifiers, currentData: oThis }
            })
          );
        }

        // If user has already connected this social platform.
        // Means in case of twitter connect request, same email user has already connected twitter before then its signup
        if (oThis._sameSocialConnectUsed(userObj)) {
          // We have received same email from 2 different twitter accounts, then we would make 2 Pepo users
          oThis.isUserSignUp = true;
          oThis.userEmailToSet = null;
        } else {
          // We have received same email from twitter and gmail, means its login for user
          oThis.isUserSignUp = false;
          oThis.userId = userObj.id;
        }
      } else {
        oThis.isUserSignUp = true;
      }
    }
  }

  /**
   * From user identifiers, decide which user can be associated with new social connect account.
   *
   * @param userIdentifiers
   * @returns {Promise<*|{}>}
   * @private
   */
  async _decideUserToAssociateNewAccount(userIdentifiers) {
    const oThis = this;

    let userIds = [];
    for (let i = 0; i < userIdentifiers.length; i++) {
      userIds.push(userIdentifiers[i].userId);
    }

    const userCacheResp = await new UserCache({ ids: userIds }).fetch();

    if (userCacheResp.isFailure()) {
      return Promise.reject(userCacheResp);
    }

    const users = [];
    for (let userId in userCacheResp.data) {
      users.push(userCacheResp.data[userId]);
    }

    // If there are more than 1 user with unique data, then we would make some decision
    if (users.length > 1) {
      let approvedCreatorUsers = [];
      // First preference is given to approved creator users.
      for (let i = 0; i < users.length; i++) {
        if (UserModel.isUserApprovedCreator(users[i])) {
          approvedCreatorUsers.push(users[i]);
        }
      }
      // If there is only one approved creator, then that user would be considered
      if (approvedCreatorUsers.length == 1) {
        return approvedCreatorUsers[0];
      } else {
        // If there are more than one approved user
        let userObjs = approvedCreatorUsers.length > 1 ? approvedCreatorUsers : users;
        // Fetch user stats of all user ids
        let statsCacheResp = await new UserStatsByUserIdsCache({ userIds: userIds }).fetch();
        // User which has max contributed by count and contributed to count will be considered
        let maxCounts = { by: 0, to: 0, uid: 0 };
        for (let index in userObjs) {
          let uId = userObjs[index].id,
            usObj = statsCacheResp.data[uId];
          if (CommonValidators.validateNonEmptyObject(usObj) && usObj.totalContributedBy >= maxCounts.by) {
            // If total contributed by is same then look for total contributed to
            if (usObj.totalContributedBy == maxCounts.by && usObj.totalContributedTo > maxCounts.to) {
              maxCounts.to = usObj.totalContributedTo;
              maxCounts.uid = uId;
            } else {
              maxCounts.by = usObj.totalContributedBy;
              maxCounts.to = usObj.totalContributedTo;
              maxCounts.uid = uId;
            }
          }
        }
        return maxCounts.uid > 0 ? userCacheResp.data[maxCounts.uid] : userObjs[0];
      }
    } else {
      return users[0] || {};
    }
  }

  /**
   * Get unique property from social platform info, like email or phone number
   *
   * @private
   */
  _getSocialUserUniqueProperties() {
    throw 'Sub-class to implement';
  }

  /**
   * Method to perform connect action
   *
   * @returns {Promise<void>}
   * @private
   */
  async _performConnect() {
    const oThis = this;

    if (oThis.isUserSignUp) {
      // Don't allow signup from web
      await oThis._blockSignUpForWeb();

      // block users from certain countries
      await oThis._blockSpecificCountries();

      await oThis._checkDuplicateDevice();

      await oThis._associateInviteCode();
      await oThis._performSignUp();
    } else {
      await oThis._performLogin();
    }
  }

  /**
   * Block Signup for web
   *
   * @returns {Promise<never>}
   * @private
   */
  async _blockSignUpForWeb() {
    const oThis = this;

    if (apiSourceConstants.isWebRequest(oThis.apiSource)) {
      await oThis._storeUserDataForFutureRef();

      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_c_b_8',
          api_error_identifier: 'web_signup_prohibited'
        })
      );
    }
  }

  /**
   * Store user data for future reference,
   * Like in case of Apple connect, user data can only be retrieved first time.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _storeUserDataForFutureRef() {
    // Do nothing
    // Apple Connect has overridden this method.
  }

  /**
   * Block specific countries
   *
   * @returns {Promise<never>}
   * @private
   */
  async _blockSpecificCountries() {
    const oThis = this;

    // nothing to check.
    if (!oThis.ipAddress) {
      console.log('--------maxmind------ empty ip:', oThis.ipAddress);
      return;
    }

    if (!oThis.ipAddress.match(/[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/)) {
      console.log('--------maxmind------ invalid ip:', oThis.ipAddress);
      return;
    }

    const Reader = require('@maxmind/geoip2-node').Reader;

    let reader = await Reader.open('/mnt/pepo/apps/pepoApi/shared/GeoLite2-Country.mmdb');

    const response = reader.country(oThis.ipAddress);

    const blockedCountriesIsoCodes = ['UA', 'CU', 'IR', 'KP', 'SY'];

    console.log('--------maxmind------ ip:', oThis.ipAddress, 'country:', response.country.isoCode);

    if (blockedCountriesIsoCodes.includes(response.country.isoCode)) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 's_c_b_6',
          api_error_identifier: 'could_not_proceed'
        })
      );
    }
  }

  /**
   * Check Duplicate Device.
   * NOTE:- If current request is from already existing device, reject it.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _checkDuplicateDevice() {
    const oThis = this;

    const deviceId = headerHelper.pepoDeviceId(oThis.headers);

    if (!deviceId) {
      return;
    }

    const userDeviceExtCacheResp = await new UserDeviceExtendedDetailsByDeviceIdsCache({
      deviceIds: [deviceId]
    }).fetch();

    if (userDeviceExtCacheResp.isFailure()) {
      return Promise.reject(userDeviceExtCacheResp);
    }

    console.log('userDeviceExtCacheResp------', userDeviceExtCacheResp, oThis.isUserSignUp);
    const userDeviceExt = userDeviceExtCacheResp.data[deviceId];

    if (CommonValidators.validateNonEmptyObject(userDeviceExt)) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_c_b_7',
          api_error_identifier: 'could_not_proceed'
        })
      );
    }
  }

  /**
   * Associate invite code if given.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _associateInviteCode() {
    const oThis = this;

    // If user has used some invite code, then associate if its valid
    if (oThis.inviteCode && oThis._validateAndSanitizeInviteCode()) {
      let inviterCodeRow = await oThis._fetchInviterCodeObject();
      // Invite code used is not present
      if (!inviterCodeRow || !inviterCodeRow.id) {
        return responseHelper.paramValidationError({
          internal_error_identifier: 's_c_b_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_invite_code']
        });
      }

      // If there is number of invites limit on invite code, and it has been reached
      if (inviterCodeRow.inviteLimit >= 0 && inviterCodeRow.inviteLimit <= inviterCodeRow.invitedUserCount) {
        return responseHelper.paramValidationError({
          internal_error_identifier: 's_c_b_2',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['expired_invite_code']
        });
      }
      oThis.inviterCodeObj = inviterCodeRow;
    }
  }

  /**
   * Append invite params and utm for signup job.
   *
   * @private
   */
  _appendCommonSignupParams() {
    const oThis = this;

    let rp = {};
    if (oThis.inviterCodeObj) {
      rp.inviterCodeId = oThis.inviterCodeObj.id;
    }
    rp.utmParams = oThis.utmParams;
    rp.inviteCode = oThis.inviteCode || '';
    rp.userEmail = oThis.userEmailToSet;
    rp.apiSource = oThis.apiSource;
    return rp;
  }

  /**
   * Method to perform signup action
   *
   * @returns {Promise<void>}
   * @private
   */
  async _performSignUp() {
    throw 'Sub-class to implement';
  }

  /**
   * Method to perform login action
   *
   * @returns {Promise<void>}
   * @private
   */
  async _performLogin() {
    throw 'Sub-class to implement';
  }

  /**
   * validate and sanitize invite code. Invite code can be a url or just an invite code.
   *
   * @returns {boolean}
   * @private
   */
  _validateAndSanitizeInviteCode() {
    const oThis = this;

    if (CommonValidators.validateNonEmptyUrl(oThis.inviteCode)) {
      let parsedUrl = urlParser.parse(oThis.inviteCode, true);

      if (!CommonValidators.validateNonEmptyObject(parsedUrl) || !['http:', 'https:'].includes(parsedUrl.protocol)) {
        return false;
      }

      if (coreConstants.PA_DOMAIN.match(parsedUrl.host)) {
        oThis.inviteCode = parsedUrl.query.invite;
      } else if (coreConstants.PA_INVITE_DOMAIN.match(parsedUrl.host)) {
        if (parsedUrl.pathname.split('/').length > 2) {
          return false;
        }

        oThis.inviteCode = parsedUrl.pathname.split('/')[1];
      } else {
        return false;
      }
    }

    if (!CommonValidators.validateInviteCode(oThis.inviteCode)) {
      return false;
    }

    oThis.inviteCode = oThis.inviteCode.toUpperCase();
    return true;
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
      return responseHelper.paramValidationError({
        internal_error_identifier: 's_t_c_vic_2',
        api_error_identifier: 'could_not_proceed',
        params_error_identifiers: ['something_went_wrong'],
        debug_options: {}
      });
    }

    return cacheResp.data[oThis.inviteCode];
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
      response.data[entityTypeConstants.goto] = { pn: null, v: null };
      if (response.data.openEmailAddFlow) {
        response.data[entityTypeConstants.goto] = gotoFactory.gotoFor(gotoConstants.addEmailScreenGotoKind);
      }
    }

    return response;
  }
}

module.exports = SocialConnectBase;
