const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserCache = require(rootPrefix + '/lib/cacheManagement/multi/User');

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
    oThis.userUniqueIdentifierKind = null;
    oThis.userUniqueIdentifierValue = null;
    oThis.socialUserObj = null;
    oThis.userIdentifierObj = null;
    oThis.newSocialAccount = false;
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

    // return oThis._sendFlowCompleteGoto(oThis.serviceResp);
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
   * @Sets oThis.userUniqueIdentifierKind, oThis.userUniqueIdentifierValue
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
      oThis.newSocialAccount = true;

      // Look for user email or phone number already exists.
      // Means user is already part of system using same or different social connect,
      if (oThis.userUniqueIdentifierKind && oThis.userUniqueIdentifierValue) {
        // TODO: Query user identifiers table
      }

      if (oThis.userIdentifierObj) {
        // This means user email or phone number is already exists in system via another or same social platform.
        const userCacheResp = await new UserCache({ ids: [oThis.userIdentifierObj.userId] }).fetch();

        if (userCacheResp.isFailure()) {
          return Promise.reject(userCacheResp);
        }

        const userObj = userCacheResp.data[oThis.userIdentifierObj.userId];

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
    if (oThis.inviteCode) {
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
}

module.exports = SocialConnectBase;
