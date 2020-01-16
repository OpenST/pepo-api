const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  InviteCodeCache = require(rootPrefix + '/lib/cacheManagement/single/InviteCodeByCode'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  gotoFactory = require(rootPrefix + '/lib/goTo/factory'),
  entityType = require(rootPrefix + '/lib/globalConstant/entityType'),
  gotoConstants = require(rootPrefix + '/lib/globalConstant/goto'),
  UserUniqueIdentifierModel = require(rootPrefix + '/app/models/mysql/UserIdentifier'),
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
   * @param {object} params.current_user
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.socialUserObj = null;
    oThis.newSocialConnect = false;
    oThis.userId = null;
    oThis.isUserSignUp = true;
    oThis.serviceResp = null;
    oThis.inviterCodeObj = null;
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
  async _validateDuplicateRequest() {}

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
      let userIdentifierObj = {},
        userUniqueElements = oThis._getSocialUserUniqueProperties();
      if (CommonValidators.validateNonEmptyObject(userUniqueElements)) {
        userIdentifierObj = await new UserUniqueIdentifierModel().fetchByKindAndValue(
          userUniqueElements.kind,
          userUniqueElements.val
        );
      }

      if (CommonValidators.validateNonEmptyObject(userIdentifierObj)) {
        // This means user email or phone number is already exists in system via another or same social platform.
        const userCacheResp = await new UserCache({ ids: [userIdentifierObj.userId] }).fetch();

        if (userCacheResp.isFailure()) {
          return Promise.reject(userCacheResp);
        }

        const userObj = userCacheResp.data[userIdentifierObj.userId];

        // If user has already connected this social platform.
        // Means in case of twitter connect request, same email user has already connected twitter before then its signup
        if (oThis._sameSocialConnectUsed(userObj)) {
          // We have received same email from 2 different twitter accounts, then we would make 2 Pepo users
          oThis.isUserSignUp = true;
        } else {
          // We have received same email from twitter and gmail, means its login for user
          oThis.isUserSignUp = false;
        }
      }
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
      await oThis._associateInviteCode();
      await oThis._performSignUp();
    } else {
      await oThis._performLogin();
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
      response.data[entityType.goto] = { pn: null, v: null };
      if (response.data.openEmailAddFlow) {
        response.data[entityType.goto] = gotoFactory.gotoFor(gotoConstants.addEmailScreenGotoKind);
      }
    }

    return response;
  }
}

module.exports = SocialConnectBase;
