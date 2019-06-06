'use strict';
/**
 * This service helps in Creating User in our System
 *
 * Note:-
 */

const rootPrefix = '../../..',
  util = require(rootPrefix + '/lib/util'),
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  UserByUserNameCache = require(rootPrefix + '/lib/cacheManagement/UserByUserName'),
  UserByIdCache = require(rootPrefix + '/lib/cacheManagement/UserById'),
  TokenUserByUserIdCache = require(rootPrefix + '/lib/cacheManagement/TokenUserByUserId'),
  KmsWrapper = require(rootPrefix + '/lib/authentication/KmsWrapper'),
  ostPlatformSdk = require(rootPrefix + '/lib/ostPlatform/jsSdkWrapper'),
  kmsGlobalConstant = require(rootPrefix + '/lib/globalConstant/kms.js'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  tokenUserConstants = require(rootPrefix + '/lib/globalConstant/tokenUser');

class SignUp extends ServiceBase {
  /**
   * @param {Object} params
   * @param {String} params.user_name: User Name
   * @param {String} params.password: Password
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.userName = params.user_name;
    oThis.password = params.password;

    oThis.userId = null;
    oThis.ostUserId = null;
    oThis.ostStatus = null;
  }

  /**
   * perform - perform user creation
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    //Check if username exists
    let fetchCacheRsp = await oThis._validateAndSanitizeParams();

    await oThis._createUser();

    await oThis._createUserInOst();

    await oThis._createTokenUser();

    return Promise.resolve(oThis._serviceResponse());
  }

  /**
   * Validate Request
   *
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;
    let userObj = await new UserByUserNameCache({ userName: oThis.userName }).fetch();

    if (userObj.isSuccess() && userObj.data.id) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 's_um_su_v_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['duplicate_user_name'],
          debug_options: {}
        })
      );
    }

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Create user
   *
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _createUser() {
    const oThis = this;
    let KMSObject = new KmsWrapper(kmsGlobalConstant.userPasswordEncryptionPurpose);
    let kmsResp = await KMSObject.generateDataKey();
    const decryptedEncryptionSalt = kmsResp['Plaintext'],
      encryptedEncryptionSalt = kmsResp['CiphertextBlob'];

    let encryptedPassword = util.createSha256Digest(decryptedEncryptionSalt, oThis.password);

    // Insert user in database
    let insertResponse = await new UserModel()
      .insert({
        user_name: oThis.userName,
        password: encryptedPassword,
        encryption_salt: encryptedEncryptionSalt,
        mark_inactive_trigger_count: 0,
        properties: 0,
        status: userConstants.invertedStatuses[userConstants.activeStatus]
      })
      .fire();

    if (!insertResponse) {
      logger.error('Error while inserting data in users table');
      return Promise.reject();
    }

    oThis.userId = insertResponse.insertId;

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Create token user
   *
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _createUserInOst() {
    const oThis = this;

    logger.log('create User In Ost');

    const createUserServiceResponse = await ostPlatformSdk.createUser();
    if (!createUserServiceResponse.isSuccess()) {
      return Promise.reject(createUserServiceResponse);
    }

    oThis.ostUserId = createUserServiceResponse.data.user.id;
    oThis.ostStatus = createUserServiceResponse.data.user.status;

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Create token user
   *
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _createTokenUser() {
    const oThis = this;
    logger.log('create Token User');
    let KMSObject = new KmsWrapper(kmsGlobalConstant.tokenUserScryptSaltPurpose);
    let kmsResp = await KMSObject.generateDataKey();
    const decryptedEncryptionSalt = kmsResp['Plaintext'],
      encryptedEncryptionSalt = kmsResp['CiphertextBlob'],
      scryptSalt = localCipher.generateRandomIv();

    let encryptedScryptSalt = localCipher.encrypt(decryptedEncryptionSalt, scryptSalt);

    // Insert token user in database
    let insertResponse = await new TokenUserModel()
      .insert({
        user_id: oThis.userId,
        ost_user_id: oThis.ostUserId,
        ost_token_holder_address: null,
        scrypt_salt: encryptedScryptSalt,
        encryption_salt: encryptedEncryptionSalt,
        properties: 0,
        ost_status: tokenUserConstants.invertedOstStatuses[oThis.ostStatus.toUpperCase()]
      })
      .fire();

    if (!insertResponse) {
      logger.error('Error while inserting data in token_users table');
      return Promise.reject();
    }

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Create token user
   *
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _serviceResponse() {
    const oThis = this;

    let userRes = await new UserByIdCache({ id: oThis.userId }).fetch();
    let tokenUserRes = await new TokenUserByUserIdCache({ userId: oThis.userId }).fetch();

    oThis.user = userRes.data;
    oThis.tokenUser = tokenUserRes.data;

    let userLoginCookieValue = new UserModel().getCookieValueFor(oThis.user, {
      browserUserAgent: oThis.browserUserAgent
    });

    return responseHelper.successWithData({
      user: oThis.user,
      tokenUser: oThis.tokenUser,
      userLoginCookieValue: userLoginCookieValue
    });
  }
}

module.exports = SignUp;
