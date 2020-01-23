const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  ConnectBase = require(rootPrefix + '/app/services/connect/Base'),
  GoogleLogin = require(rootPrefix + '/lib/connect/login/ByGoogle'),
  GoogleSignup = require(rootPrefix + '/lib/connect/signup/ByGoogle'),
  GoogleUserModel = require(rootPrefix + '/app/models/mysql/GoogleUser'),
  GoogleUserInfoLib = require(rootPrefix + '/lib/connect/wrappers/google/UserInfo'),
  GoogleUserFormatter = require(rootPrefix + '/lib/connect/wrappers/google/UserEntityFormatter'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  userIdentifierConstants = require(rootPrefix + '/lib/globalConstant/userIdentifier'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common');

/**
 * Google Connect
 *
 * @class GithubConnect
 */
class GoogleConnect extends ConnectBase {
  /**
   * Constructor for Google connect.
   *
   * @param {object} params
   * @param {string} params.access_token
   * @param {string} params.expires_in
   * @param {string} params.refresh_token
   * @param {string} params.token_type
   * @param {string} params.id_token
   *
   * @augments ServiceBase
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
   * Method to validate access tokens and fetching data from Social platforms.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validateAndFetchSocialInfo() {
    const oThis = this;

    let googleUserRsp = await new GoogleUserInfoLib({ accessToken: oThis.accessToken }).perform();

    if (googleUserRsp.isFailure()) {
      return Promise.reject(googleUserRsp);
    }

    oThis.formattedGoogleUser = googleUserRsp.data;
  }

  /**
   * Method to fetch data from google_users tables
   *
   * @Sets oThis.socialUserObj
   * @returns {Promise<void>}
   * @private
   */
  async _fetchSocialUser() {
    const oThis = this;

    //fetch social user on the basis of google user id
    let queryResponse = await new GoogleUserModel()
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
   * @param userObj
   * @private
   */
  _sameSocialConnectUsed(userObj) {
    // Look for property set in user object.
    const propertiesArray = new UserModel().getBitwiseArray('properties', userObj.properties);

    return propertiesArray.indexOf(userConstants.hasGoogleLoginProperty) > -1;
  }

  /**
   * Method to perform signup action
   *
   * @returns {Promise<void>}
   * @private
   */
  async _performSignUp() {
    const oThis = this;

    let signUpParams = {
      accessToken: oThis.accessToken,
      refreshToken: oThis.refreshToken,
      userGoogleEntity: oThis.formattedGoogleUser
    };

    console.log('signUpParams: ', signUpParams);

    Object.assign(signUpParams, oThis._appendCommonSignupParams());
    oThis.serviceResp = await new GoogleSignup(signUpParams).perform();
  }

  /**
   * Method to perform login action
   *
   * @returns {Promise<void>}
   * @private
   */
  async _performLogin() {
    const oThis = this;

    let loginParams = {
      accessToken: oThis.accessToken,
      refreshToken: oThis.refreshToken,
      userGoogleEntity: oThis.formattedGoogleUser,
      googleUserObj: oThis.socialUserObj,
      userId: oThis.userId,
      isNewSocialConnect: oThis.newSocialConnect
    };

    oThis.serviceResp = await new GoogleLogin(loginParams).perform();
  }

  /**
   * Get unique property from github info, like email
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
   * @returns {null}
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

    let email = oThis._getCurrentSocialEmail();

    await new GoogleUserModel()
      .update({ email: email })
      .where({ id: oThis.socialUserObj.id })
      .fire();
  }
}

module.exports = GoogleConnect;
