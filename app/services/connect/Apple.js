const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  AppleLogin = require(rootPrefix + '/lib/connect/login/ByApple'),
  ConnectBase = require(rootPrefix + '/app/services/connect/Base'),
  AppleSignup = require(rootPrefix + '/lib/connect/signup/ByApple'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  AppleUserModel = require(rootPrefix + '/app/models/mysql/AppleUser'),
  GetAccessToken = require(rootPrefix + '/lib/connect/wrappers/apple/GetAccessToken'),
  GetApplePublicKey = require(rootPrefix + '/lib/connect/wrappers/apple/GetPublicKey'),
  AppleNameFormatter = require(rootPrefix + '/lib/connect/wrappers/apple/AppleNameFormatter'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  appleHelper = require(rootPrefix + '/lib/connect/wrappers/apple/helper'),
  apiRefererConstants = require(rootPrefix + '/lib/globalConstant/apiReferers'),
  userIdentifierConstants = require(rootPrefix + '/lib/globalConstant/userIdentifier');

const APPLE_API_URL = 'https://appleid.apple.com';
/**
 * Apple Connect
 *
 * @class AppleConnect
 */
class AppleConnect extends ConnectBase {
  /**
   * Constructor for apple connect.
   *
   * @param {object} params
   * @param {string} params.authorization_code
   * @param {string} params.identity_token
   * @param {string} params.apple_user_id
   * @param {string} params.full_name
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.authorizationCode = params.authorization_code;
    oThis.identityToken = params.identity_token;
    oThis.appleId = params.apple_user_id;
    oThis.duplicateRequestIdentifier = oThis.appleId;
    oThis.fullName = params.full_name;

    oThis.appleOAuthDetails = null;
    oThis.decryptedAppleEmail = null;
  }

  /**
   * Method to validate access tokens and fetching data from Social platforms.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validateAndFetchSocialInfo() {
    const oThis = this;

    logger.log('FullName: ', oThis.fullName);

    let promiseArray = [];
    promiseArray.push(oThis.verifyIdentityToken());
    promiseArray.push(oThis.getAccessTokenFromApple());

    await Promise.all(promiseArray);
  }

  /**
   * Verify identity token
   *
   * @returns {Promise<void>}
   */
  async verifyIdentityToken() {
    const oThis = this;

    let publicKey = await new GetApplePublicKey().perform(),
      decryptedIdentityToken = await appleHelper.getDecryptedIdentityToken(oThis.identityToken, publicKey);

    if (decryptedIdentityToken.iss !== APPLE_API_URL) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_c_l_ba_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: {
            Error: `id token not issued by correct OpenID provider - expected: ${APPLE_API_URL} | from: ${
              decryptedIdentityToken.iss
            }`
          }
        })
      );
    }

    if (decryptedIdentityToken.exp < Date.now() / 1000) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_c_l_ba_3',
          api_error_identifier: 'something_went_wrong',
          debug_options: {
            Error: `id token has expired`
          }
        })
      );
    }

    oThis.decryptedAppleEmail = decryptedIdentityToken.email;

    let appleClientId = coreConstants.PA_APPLE_CLIENT_ID;
    // In case of web request, we are not getting apple id in request
    if (apiRefererConstants.isWebRequest(oThis.apiReferer)) {
      oThis.appleId = decryptedIdentityToken.sub;
      // For Web request client id is appended .signin by default by apple.
      appleClientId = appleClientId + '.signin';
    }

    if (decryptedIdentityToken.aud !== appleClientId) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_c_l_ba_2',
          api_error_identifier: 'something_went_wrong',
          debug_options: {
            Error: `aud parameter does not include this client - is: ${
              decryptedIdentityToken.aud
            } | expected: ${appleClientId}`
          }
        })
      );
    }
  }

  /**
   * Get access token from apple
   *
   * @returns {Promise<void>}
   */
  async getAccessTokenFromApple() {
    const oThis = this;

    let clientSecret = appleHelper.createClientSecret(),
      oAuthDetails = await new GetAccessToken({
        clientSecret: clientSecret,
        authorizationCode: oThis.authorizationCode
      }).perform();

    if (oAuthDetails.error) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_c_a_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: {}
        })
      );
    }
    oThis.appleOAuthDetails = oAuthDetails;
  }

  /**
   * Method to fetch data from respective social_users tables
   *
   * @Sets oThis.socialUserObj
   * @returns {Promise<void>}
   * @private
   */
  async _fetchSocialUser() {
    const oThis = this;

    //fetch social user on the basis of apple id
    let queryResponse = await new AppleUserModel()
      .select('*')
      .where(['apple_id = ?', oThis.appleId])
      .fire();

    if (queryResponse.length > 0) {
      oThis.socialUserObj = new AppleUserModel().formatDbData(queryResponse[0]);
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

    return propertiesArray.indexOf(userConstants.hasAppleLoginProperty) > -1;
  }

  /**
   * Method to perform signup action
   *
   * @returns {Promise<void>}
   * @private
   */
  async _performSignUp() {
    const oThis = this;

    let formattedAppleName = new AppleNameFormatter({ fullName: oThis.fullName, email: oThis.decryptedAppleEmail });

    let params = {
      appleOAuthDetails: oThis.appleOAuthDetails,
      appleUserEntity: {
        id: oThis.appleId,
        email: oThis.decryptedAppleEmail,
        fullName: formattedAppleName.formattedName,
        socialUserName: formattedAppleName.socialUserName
      }
    };

    Object.assign(params, oThis._appendCommonSignupParams());

    oThis.serviceResp = await new AppleSignup(params).perform();
  }

  /**
   * Method to perform login action
   *
   * @returns {Promise<void>}
   * @private
   */
  async _performLogin() {
    const oThis = this;

    let formattedAppleName = new AppleNameFormatter({ fullName: oThis.fullName, email: oThis.decryptedAppleEmail });
    let appleUserEntity = {
      id: oThis.appleId,
      email: oThis.decryptedAppleEmail,
      fullName: formattedAppleName.formattedName,
      socialUserName: formattedAppleName.socialUserName
    };
    let params = {
      appleUserObj: oThis.socialUserObj,
      appleUserEntity: appleUserEntity,
      accessToken: oThis.appleOAuthDetails.access_token,
      refreshToken: oThis.appleOAuthDetails.refresh_token,
      isNewSocialConnect: oThis.newSocialConnect,
      userId: oThis.userId,
      apiReferer: oThis.apiReferer
    };

    oThis.serviceResp = await new AppleLogin(params).perform();
  }

  /**
   * Get unique property from github info, like email
   *
   * @returns {{}|{kind: string, value: *}}
   * @private
   */
  _getSocialUserUniqueProperties() {
    const oThis = this;

    if (!oThis.decryptedAppleEmail || !CommonValidators.isValidEmail(oThis.decryptedAppleEmail)) {
      return {};
    }

    return { kind: userIdentifierConstants.emailKind, values: [oThis.decryptedAppleEmail] };
  }

  /**
   * Get current social email from parameters.
   *
   * @returns {null}
   * @private
   */
  _getCurrentSocialEmail() {
    const oThis = this;

    return oThis.decryptedAppleEmail;
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

    await new AppleUserModel()
      .update({ email: email })
      .where({ id: oThis.socialUserObj.id })
      .fire();
  }
}

module.exports = AppleConnect;
