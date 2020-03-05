const rootPrefix = '../../..',
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  ConnectBase = require(rootPrefix + '/app/services/connect/Base'),
  GoogleLogin = require(rootPrefix + '/lib/connect/login/ByGoogle'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  GoogleSignup = require(rootPrefix + '/lib/connect/signup/ByGoogle'),
  GoogleUserModel = require(rootPrefix + '/app/models/mysql/GoogleUser'),
  GoogleUserInfoLib = require(rootPrefix + '/lib/connect/wrappers/google/UserInfo'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  userIdentifierConstants = require(rootPrefix + '/lib/globalConstant/userIdentifier');

/**
 * Class for google connect.
 *
 * @class GoogleConnect
 */
class GoogleConnect extends ConnectBase {
  /**
   * Constructor for google connect.
   *
   * @param {object} params
   * @param {string} params.access_token
   * @param {string} params.expires_in
   * @param {string} params.refresh_token
   * @param {string} params.token_type
   * @param {string} params.id_token
   *
   * @augments ConnectBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.accessToken = params.access_token;
    oThis.tokenExpiry = params.expires_in;
    oThis.refreshToken = params.refresh_token;
    oThis.tokenType = params.token_type;
    oThis.idToken = params.id_token;
    oThis.duplicateRequestIdentifier = oThis.accessToken;

    oThis.formattedGoogleUser = null;
  }

  /**
   * Method to validate access tokens and fetching data from social platforms.
   *
   * @sets oThis.formattedGoogleUser
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validateAndFetchSocialInfo() {
    const oThis = this;

    const googleUserRsp = await new GoogleUserInfoLib({ accessToken: oThis.accessToken }).perform();
    if (googleUserRsp.isFailure()) {
      return Promise.reject(googleUserRsp);
    }

    oThis.formattedGoogleUser = googleUserRsp.data;
  }

  /**
   * Method to fetch data from google_users tables.
   *
   * @sets oThis.socialUserObj
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchSocialUser() {
    const oThis = this;

    // Fetch social user on the basis of google user id.
    const queryResponse = await new GoogleUserModel()
      .select('*')
      .where(['google_id = ?', oThis.formattedGoogleUser.id])
      .fire();

    if (queryResponse.length > 0) {
      oThis.socialUserObj = new GoogleUserModel().formatDbData(queryResponse[0]);
    }
  }

  /**
   * Method to check whether same social platform is connected before.
   *
   * @param {object} userObj
   *
   * @returns {boolean}
   * @private
   */
  _sameSocialConnectUsed(userObj) {
    // Look for property set in user object.
    const propertiesArray = new UserModel().getBitwiseArray('properties', userObj.properties);

    return propertiesArray.indexOf(userConstants.hasGoogleLoginProperty) > -1;
  }

  /**
   * Method to perform signup action.
   *
   * @sets oThis.serviceResp
   *
   * @returns {Promise<void>}
   * @private
   */
  async _performSignUp() {
    const oThis = this;

    const signUpParams = {
      accessToken: oThis.accessToken,
      refreshToken: oThis.refreshToken,
      userGoogleEntity: oThis.formattedGoogleUser
    };

    Object.assign(signUpParams, oThis._appendCommonSignupParams());
    oThis.serviceResp = await new GoogleSignup(signUpParams).perform();
  }

  /**
   * Method to perform login action.
   *
   * @sets oThis.serviceResp
   *
   * @returns {Promise<void>}
   * @private
   */
  async _performLogin() {
    const oThis = this;

    const loginParams = {
      accessToken: oThis.accessToken,
      refreshToken: oThis.refreshToken,
      userGoogleEntity: oThis.formattedGoogleUser,
      googleUserObj: oThis.socialUserObj,
      userId: oThis.userId,
      isNewSocialConnect: oThis.newSocialConnect,
      apiSource: oThis.apiSource
    };

    oThis.serviceResp = await new GoogleLogin(loginParams).perform();
  }

  /**
   * Get unique property from github info, like email.
   *
   * @returns {{}|{kind: string, value: *}}
   * @private
   */
  _getSocialUserUniqueProperties() {
    const oThis = this;

    if (!oThis.formattedGoogleUser.email || !CommonValidators.isValidEmail(oThis.formattedGoogleUser.email)) {
      return {};
    }

    return { kind: userIdentifierConstants.emailKind, values: [oThis.formattedGoogleUser.email] };
  }

  /**
   * Get current social email from parameters.
   *
   * @returns {string/null}
   * @private
   */
  _getCurrentSocialEmail() {
    const oThis = this;

    return oThis.formattedGoogleUser.email;
  }

  /**
   * Update email in social users.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateEmailInSocialUsers() {
    const oThis = this;

    const email = oThis._getCurrentSocialEmail();

    await new GoogleUserModel()
      .update({ email: email })
      .where({ id: oThis.socialUserObj.id })
      .fire();
  }
}

module.exports = GoogleConnect;
