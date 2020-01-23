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

    logger.log('Decrypted Identity Token: ', decryptedIdentityToken);

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
            Error: `aud parameter does not include this client - is: ${decryptedIdentityToken.aud} | expected: ${
              coreConstants.PA_APPLE_CLIENT_ID
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

    // oAuthDetails = {
    //   access_token: 'a591f44180f07407b83585446d4452718.0.nvt.0bXZTXBEJEQ55EJjMzddeA',
    //   token_type: 'Bearer',
    //   expires_in: 3600,
    //   refresh_token: 'refdc0be07e2d4dfdba2c3d1b9ef658f6.0.nvt.g_nz14NPB6wIJvQEn1Lc7A',
    //   id_token:
    //     'eyJraWQiOiJBSURPUEsxIiwiYWxnIjoiUlMyNTYifQ.eyJpc3MiOiJodHRwczovL2FwcGxlaWQuYXBwbGUuY29tIiwiYXVkIjoiY29tLnBlcG8uc3RhZ2luZyIsImV4cCI6MTU3OTI3NDc1MywiaWF0IjoxNTc5Mjc0MTUzLCJzdWIiOiIwMDAwNTMuZjA4N2E2OTJlZDc2NDQzZjgyNjk2MjY0YzM4M2E3NGIuMTM0OSIsIm5vbmNlIjoiMDUyYjgyZTExOTNlNTdmZWZkYzAzYTI2YjJmZDAyM2YzOGI1NGVlMDE1NWFjZDFjMzY4YzE4ZjVjZmQwNWZiOSIsImF0X2hhc2giOiJ6aHlMZWVSb2FjWk91NTk0RFJMZDZBIiwiZW1haWwiOiJyYWNoaW5Ab3N0LmNvbSIsImVtYWlsX3ZlcmlmaWVkIjoidHJ1ZSIsImF1dGhfdGltZSI6MTU3OTI3Mzk5MH0.ltRvDAm85bELnoada4HWgW_2G19vAsHo9fPIp65xhEzW0sTOZbRlKTW4oKa8LwQ_O-LrtDQXGhjSwg7LWN193yf8ojz2l1-MQLt3bGCjs2hQRHiY3Ztfc8N2K-1zUQYMN2HokNR1N4t9_vgqj5hSx9Ngmy6IMG-rde8ypGJX9QEjZQ4xXDKTe6-Dm9VG24xXheyyXCakVr19zlDaRjSVIgX_Ass16avhTjBgVe2gb-_xcJnjc9loKKR_Bq8dYreZucPefAD2EhX6foTsRTp4EX-UG49nxLG0o02aQbYeTU-tMdtxrJalT8WTjsCnKlFEzpD5QW8ch_wtP8v-SzAF8g'
    // };
    console.log('--oAuthDetails--', oAuthDetails);
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

    Object.assign(params, oThis._appendInviteParams());

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
      userId: oThis.userId
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
