const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  AppleLogin = require(rootPrefix + '/lib/connect/login/ByApple'),
  ConnectBase = require(rootPrefix + '/app/services/connect/Base'),
  AppleSignup = require(rootPrefix + '/lib/connect/signup/ByApple'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  AppleUserModel = require(rootPrefix + '/app/models/mysql/AppleUser'),
  GetAccessToken = require(rootPrefix + '/lib/connect/wrappers/apple/GetAccessToken'),
  GetApplePublicKey = require(rootPrefix + '/lib/connect/wrappers/apple/GetPublicKey'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  appleHelper = require(rootPrefix + '/lib/connect/wrappers/apple/helper'),
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
   * @param {string} params.apple_id
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
    oThis.appleId = params.apple_id;
    oThis.name = params.full_name;

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

    if (decryptedIdentityToken.aud !== coreConstants.PA_APPLE_CLIENT_ID) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_c_l_ba_2',
          api_error_identifier: 'something_went_wrong',
          debug_options: {
            Error: `aud parameter does not include this client - is: ${jwtClaims.aud} | expected: ${clientID}`
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
      oThis.socialUserObj = queryResponse[0];
    }
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

    let params = {
      accessToken: oThis.appleOAuthDetails.access_token,
      refreshToken: oThis.appleOAuthDetails.refresh_token,
      email: oThis.userUniqueIdentifierValue,
      fullName: oThis.fullName
    };

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
    let params = {
      accessToken: oThis.appleOAuthDetails.access_token,
      refreshToken: oThis.appleOAuthDetails.refresh_token,
      email: oThis.userUniqueIdentifierValue,
      fullName: oThis.fullName
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

    return { kind: userIdentifierConstants.emailKind, value: oThis.decryptedAppleEmail };
  }
}

module.exports = AppleConnect;
