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
  basicHelper = require(rootPrefix + '/helpers/basic'),
  appleHelper = require(rootPrefix + '/lib/connect/wrappers/apple/helper'),
  apiSourceConstants = require(rootPrefix + '/lib/globalConstant/apiSource'),
  socialConnectServiceTypeConstants = require(rootPrefix + '/lib/globalConstant/socialConnectServiceType'),
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
   * @param {Boolean} params.dev_login
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
    oThis.isDevLogin = params.dev_login;

    oThis.appleOAuthDetails = null;
    oThis.decryptedAppleEmail = null;
    oThis.appleClientId = null;
    oThis.appleRedirectUri = null;
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

    oThis.appleRedirectUri = basicHelper.getLoginRedirectUrl(
      oThis.isDevLogin,
      socialConnectServiceTypeConstants.appleSocialConnect
    );
    // Different client id has to be used for app and web requests.
    if (apiSourceConstants.isWebRequest(oThis.apiSource)) {
      oThis.appleClientId = coreConstants.PA_APPLE_WEB_SERVICE_ID;
    } else {
      oThis.appleClientId = coreConstants.PA_APPLE_CLIENT_ID;
    }

    // let promiseArray = [];
    // promiseArray.push(oThis.verifyIdentityToken());
    // promiseArray.push(oThis.getAccessTokenFromApple());
    await oThis.getAccessTokenFromApple();
    await oThis.verifyIdentityToken();

    // await Promise.all(promiseArray);
  }

  /**
   * Verify identity token
   *
   * @returns {Promise<void>}
   */
  async verifyIdentityToken() {
    const oThis = this;

    let publicKeys = await new GetApplePublicKey().perform(),
      decryptedIdentityToken = await appleHelper.getDecryptedIdentityToken(oThis.identityToken, publicKeys);

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

    if (decryptedIdentityToken.email) {
      oThis.decryptedAppleEmail = decryptedIdentityToken.email;
    }

    // In case of web request, we are not getting apple id in response
    if (apiSourceConstants.isWebRequest(oThis.apiSource)) {
      oThis.appleId = decryptedIdentityToken.sub;
    }

    if (decryptedIdentityToken.aud !== oThis.appleClientId) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_c_l_ba_2',
          api_error_identifier: 'something_went_wrong',
          debug_options: {
            Error: `aud parameter does not include this client - is: ${decryptedIdentityToken.aud} | expected: ${
              oThis.appleClientId
            }`
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

    let clientSecret = appleHelper.createClientSecret(oThis.appleClientId),
      oAuthDetails = await new GetAccessToken({
        clientSecret: clientSecret,
        authorizationCode: oThis.authorizationCode,
        appleClientId: oThis.appleClientId,
        appleRedirectUri: oThis.appleRedirectUri
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
    console.log('appleOAuthDetails: ', oThis.appleOAuthDetails);
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

    let params = {
      appleOAuthDetails: oThis.appleOAuthDetails,
      appleUserEntity: oThis._getAppleFormattedData(),
      appleUserObj: oThis.socialUserObj,
      headers: oThis.headers
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

    let params = {
      appleUserObj: oThis.socialUserObj,
      appleUserEntity: oThis._getAppleFormattedData(),
      accessToken: oThis.appleOAuthDetails.access_token,
      refreshToken: oThis.appleOAuthDetails.refresh_token,
      isNewSocialConnect: oThis.newSocialConnect,
      userId: oThis.userId,
      apiSource: oThis.apiSource
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
   * Get Formatted data for Apple
   *
   * @returns {{fullName: *, socialUserName: *, id: *, email: *}}
   * @private
   */
  _getAppleFormattedData() {
    const oThis = this;

    let formattedAppleName = new AppleNameFormatter({ fullName: oThis.fullName, email: oThis.decryptedAppleEmail });
    let appleUserEntity = {
      id: oThis.appleId,
      email: oThis.decryptedAppleEmail,
      fullName: formattedAppleName.formattedName,
      socialUserName: formattedAppleName.socialUserName
    };

    return appleUserEntity;
  }

  /**
   * Store user data for future reference,
   * Like in case of Apple connect, user data can only be retrieved first time.
   * This method is overridden only for apple.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _storeUserDataForFutureRef() {
    const oThis = this;

    const appleUserEntity = oThis._getAppleFormattedData(),
      insertParams = {
        apple_id: appleUserEntity.id,
        name: appleUserEntity.fullName,
        email: appleUserEntity.email
      };
    // If Apple user obj is already present, then do nothing
    // As no data can be updated
    if (!oThis.socialUserObj) {
      await new AppleUserModel().insert(insertParams).fire();
    }
  }
}

module.exports = AppleConnect;
