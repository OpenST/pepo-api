const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  KmsWrapper = require(rootPrefix + '/lib/aws/KmsWrapper'),
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
  TwitterUserExtendedModel = require(rootPrefix + '/app/models/mysql/TwitterUserExtended'),
  SecureUserCache = require(rootPrefix + '/lib/cacheManagement/single/SecureUser'),
  UserByUserNameCache = require(rootPrefix + '/lib/cacheManagement/single/UserByUsername'),
  TokenUserDetailByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  TwitterUserByTwitterIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TwitterUserByTwitterIds'),
  SecureTwitterUserExtendedByTwitterUserIdCache = require(rootPrefix +
    '/lib/cacheManagement/single/SecureTwitterUserExtendedByTwitterUserId'),
  AccountTwitterRequestClass = require(rootPrefix + '/lib/twitter/oAuth1.0/Account'),
  util = require(rootPrefix + '/lib/util'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  twitterUserExtendedConstants = require(rootPrefix + '/lib/globalConstant/twitterUserExtended'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  kmsGlobalConstant = require(rootPrefix + '/lib/globalConstant/kms'),
  ostPlatformSdk = require(rootPrefix + '/lib/ostPlatform/jsSdkWrapper'),
  tokenUserConstants = require(rootPrefix + '/lib/globalConstant/tokenUser');

/**
 * Class for Twitter Connect service.
 *
 * @class TwitterConnect
 */
class TwitterConnect extends ServiceBase {
  /**
   * Constructor for signup service.
   *
   * @param {object} params
   * @param {string} params.token: oAuth Token
   * @param {string} params.secret: oAuth Secret
   * @param {string} params.twitter_id: Twitter_id
   * @param {string} params.handle: Handle
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.token = params.token;
    oThis.secret = params.secret;
    oThis.twitterId = params.twitter_id;
    oThis.handle = params.handle;

    oThis.twitterUserObj = null;
    oThis.userTwitterEntity = null;

    oThis.userId = null;
    oThis.secureUserObj = null;
    oThis.tokenUserObj = null;
    oThis.twitterUserExtendedObj = null;

    oThis.encryptedEncryptionSalt = null;
    oThis.encryptionSalt = null;

    oThis.userName = null;
    oThis.name = null;
    oThis.email = null;
    oThis.profileImageId = null;
    oThis.link = null;
    oThis.bio = null;

    oThis.ostUserId = null;
    oThis.ostStatus = null;
  }

  /**
   * Perform: Perform user creation.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchTwitterUserAndValidateCredentials();

    if (oThis._isSignupAction) {
      await oThis._performSignup();
    } else {
      await oThis._performLogin();
    }

    return Promise.resolve(oThis._serviceResponse());
  }

  /**
   * Fetch Twitter User Obj if present and Validate Credentials.
   *
   * @return {Promise<Result>}
   * @private
   */
  async _fetchTwitterUserAndValidateCredentials() {
    const oThis = this;
    logger.log('Start::TwitterUser And Validate Credentials');

    const promisesArray = [];

    promisesArray.push(oThis._fetchTwitterUser());
    promisesArray.push(oThis._validateTwitterCredentials());

    await Promise.all(promisesArray);

    logger.log('End::TwitterUser And Validate Credentials');

    return responseHelper.successWithData({});
  }

  /**
   * Fetch Twitter User Obj if present.
   *
   * @sets oThis.userId, oThis.twitterUserObj
   *
   * @return {Promise<Result>}
   * @private
   */
  async _fetchTwitterUser() {
    const oThis = this;

    logger.log('Start::Fetch Twitter User');

    const twitterUserObjCacheResp = await new TwitterUserByTwitterIdsCache({ twitterIds: oThis.twitterId }).fetch();

    if (twitterUserObjCacheResp.isFailure()) {
      return Promise.reject(userObjCacheResp);
    }

    oThis.twitterUserObj = twitterUserObjCacheResp.data[oThis.twitterId] || null;
    oThis.userId = oThis.twitterUserObj.userId;

    logger.log('End::Fetch Twitter User');
    return responseHelper.successWithData({});
  }

  /**
   * Verify Credentials and get profile data from twitter.
   *
   * @sets oThis.userTwitterEntity
   *
   * @return {Promise<Result>}
   * @private
   */
  async _validateTwitterCredentials() {
    const oThis = this;

    logger.log('Start::Validate Twitter Credentials');

    let twitterResp = new AccountTwitterRequestClass.verifyCredentials({
      oAuthToken: oThis.token,
      oAuthTokenSecret: oThis.secret
    }).catch(function(err) {
      logger.error('Error while validate Credentials for twitter: ', err);
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 's_t_c_vtc_1',
          api_error_identifier: 'unauthorized_api_request',
          debug_options: {}
        })
      );
    });

    if (twitterResp.isFailure()) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 's_t_c_vtc_2',
          api_error_identifier: 'unauthorized_api_request',
          debug_options: {}
        })
      );
    }

    oThis.userTwitterEntity = twitterResp.data.userEntity;

    if (oThis.userTwitterEntity.idStr != oThis.twitterId || oThis.userTwitterEntity.handle != oThis.handle) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 's_t_c_vtc_3',
          api_error_identifier: 'unauthorized_api_request',
          debug_options: {}
        })
      );
    }

    logger.log('End::Validate Twitter Credentials');

    return responseHelper.successWithData({});
  }

  /**
   * Check If signup or login is needed for twitter connect.
   *
   * @return {Boolean}
   * @private
   */
  async _isSignupAction() {
    const oThis = this;
    return !(oThis.twitterUserObj && oThis.twitterUserObj.userId);
  }

  /**
   * Perform For Login Via Twitter.
   *
   * @return {Promise<void>}
   * @private
   */
  async _performLogin() {
    const oThis = this;
    logger.log('Start::Perform Twitter login');

    const promisesArray = [];

    var promiseRes = oThis._fetchSecureUser().then(oThis._updateTwitterUserExtended());

    promisesArray.push(promiseRes);
    promisesArray.push(oThis._fetchTokenUser());

    await Promise.all(promisesArray);

    logger.log('End::Perform Twitter Login');

    return responseHelper.successWithData({});
  }

  /**
   *  Perform For Signup Via Twitter.
   *
   * @return {Promise<void>}
   * @private
   */
  async _performSignup() {
    const oThis = this;
    logger.log('Start::Perform Twitter Signup');

    const promisesArray1 = [],
      promisesArray2 = [];

    let promiseResp = oThis._createUserInOst();

    promisesArray1.push(oThis._saveProfileImage());
    promisesArray1.push(oThis._setUserName());
    promisesArray1.push(oThis._setKMSEncryptionSalt());

    await Promise.all(promisesArray1);

    await oThis._createUser();

    let promiseResp1 = oThis._createUpdateTwitterUser().then(oThis._createTwitterUserExtended());
    let promiseResp2 = promiseResp.then(oThis._createTokenUser());

    promisesArray2.push(promiseResp1);
    promisesArray2.push(promiseResp2);

    await Promise.all(promisesArray2);

    // await enqueueSignUpTask();

    logger.log('End::Perform Twitter Signup');

    return responseHelper.successWithData({});
  }

  /**
   * Generate Data Key from KMS.
   *
   * @sets oThis.encryptedEncryptionSalt, oThis.encryptionSalt
   *
   * @return {Promise<Result>}
   *
   * @private
   */
  async _setKMSEncryptionSalt() {
    const oThis = this;
    logger.log('Start::Generate Data Key from KMS');

    const KMSObject = new KmsWrapper(kmsGlobalConstant.userPasswordEncryptionPurpose);
    const kmsResp = await KMSObject.generateDataKey();

    oThis.encryptionSalt = kmsResp.Plaintext;
    oThis.encryptedEncryptionSalt = kmsResp.CiphertextBlob;

    logger.log('End::Generate Data Key from KMS');
    return responseHelper.successWithData({});
  }

  /**
   * Fetch Secure User Obj.
   *
   * @sets oThis.secureUserObj
   *
   * @return {Promise<Result>}
   *
   * @private
   */
  async _fetchSecureUser() {
    const oThis = this;

    logger.log('Start::Fetching Secure User for Twitter login');

    const secureUserRes = await new SecureUserCache({ id: oThis.userId }).fetch();

    if (secureUserRes.isFailure()) {
      return Promise.reject(secureUserRes);
    }

    oThis.secureUserObj = secureUserRes.data;

    if (oThis.secureUserObj.status !== userConstants.activeStatus) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 's_t_c_fsu_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['user_not_active'],
          debug_options: {}
        })
      );
    }

    logger.log('End::Fetching Secure User for Twitter login');

    return responseHelper.successWithData({});
  }

  /**
   * Update Twitter User Extended object twitter credentials and status.
   *
   * @return {Promise<Result>}
   * @private
   */
  async _updateTwitterUserExtended() {
    const oThis = this;
    logger.log('Start::Update Twitter User Extended for login');

    const decryptedEncryptionSalt = localCipher.decrypt(
      coreConstants.CACHE_SHA_KEY,
      oThis.secureUserObj.encryptionSaltLc
    );
    const eSecretKms = localCipher.encrypt(decryptedEncryptionSalt, oThis.secret);

    const SecureTwitterUserExtendedRes = await new SecureTwitterUserExtendedByTwitterUserIdCache({
      twitterUserId: oThis.twitterUserObj.id
    }).fetch();

    if (SecureTwitterUserExtendedRes.isFailure()) {
      return Promise.reject(SecureTwitterUserExtendedRes);
    }

    oThis.twitterUserExtendedObj = SecureTwitterUserExtendedRes.data;

    await new TwitterUserExtendedModel()
      .update({
        token: oThis.token,
        secret: eSecretKms,
        status: twitterUserExtendedConstants.invertedStatuses(invertedStatuses.activeStatus)
      })
      .where({ id: oThis.twitterUserExtendedObj.id })
      .fire();

    await TwitterUserExtendedModel.flushCache({
      id: oThis.twitterUserExtendedObj.id,
      twitter_user_id: oThis.twitterUserObj.id
    });

    logger.log('End::Update Twitter User Extended for login');

    return responseHelper.successWithData({});
  }

  /**
   * Fetch token user.
   *
   * @sets oThis.tokenUserObj
   *
   * @return {Promise<void>}
   * @private
   */
  async _fetchTokenUser() {
    const oThis = this;

    logger.log('Start::Fetching token user.');

    const tokenUserRes = await new TokenUserDetailByUserIdsCache({ userIds: [oThis.userId] }).fetch();

    if (tokenUserRes.isFailure()) {
      return Promise.reject(tokenUserRes);
    }

    oThis.tokenUserObj = tokenUserRes.data[oThis.userId];

    logger.log('End::Fetching token user.');

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Create user.
   *
   * @sets oThis.userId
   *
   * @return {Promise<void>}
   * @private
   */
  async _createUser() {
    const oThis = this;

    logger.log('Start::Create user');

    let encryptedCookieToken = '';

    let insertData = {
      user_name: oThis.userName,
      name: oThis.name,
      cookie_token: encryptedCookieToken,
      encryption_salt: encryptedEncryptionSalt,
      mark_inactive_trigger_count: 0,
      properties: 0,
      status: userConstants.invertedStatuses[userConstants.activeStatus]
    };
    // Insert user in database.
    const insertResponse = await new UserModel().insert(insertData).fire();

    if (!insertResponse) {
      logger.error('Error while inserting data in users table.');
      return Promise.reject(new Error('Error while inserting data in users table.'));
    }

    oThis.userId = insertResponse.insertId;
    insertData.id = insertResponse.insertId;

    let formattedInsertData = new UserModel().formatDbData(insertData);
    await UserModel.flushCache(formattedInsertData);

    logger.log('End::Create user');
    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Create token user.
   *
   * @sets oThis.ostUserId, oThis.ostStatus
   *
   * @return {Promise<void>}
   * @private
   */
  async _createUserInOst() {
    const oThis = this;

    logger.log('Start::Creating user in OST');

    const createUserServiceResponse = await ostPlatformSdk.createUser();
    if (!createUserServiceResponse.isSuccess()) {
      return Promise.reject(createUserServiceResponse);
    }

    oThis.ostUserId = createUserServiceResponse.data.user.id;
    oThis.ostStatus = createUserServiceResponse.data.user.status;

    logger.log('End::Creating user in OST');

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

    logger.log('Start::Creating token user');
    const KMSObject = new KmsWrapper(kmsGlobalConstant.tokenUserScryptSaltPurpose);
    const kmsResp = await KMSObject.generateDataKey();
    const decryptedEncryptionSalt = kmsResp.Plaintext,
      encryptedEncryptionSalt = kmsResp.CiphertextBlob,
      scryptSalt = localCipher.generateRandomIv(32);

    const encryptedScryptSalt = localCipher.encrypt(decryptedEncryptionSalt, scryptSalt);

    let insertData = {
      user_id: oThis.userId,
      ost_user_id: oThis.ostUserId,
      ost_token_holder_address: null,
      scrypt_salt: encryptedScryptSalt,
      encryption_salt: encryptedEncryptionSalt,
      properties: 0,
      ost_status: tokenUserConstants.invertedOstStatuses[oThis.ostStatus.toUpperCase()]
    };
    // Insert token user in database.
    const insertResponse = await new TokenUserModel().insert(insertData).fire();

    if (!insertResponse) {
      logger.error('Error while inserting data in token_users table.');

      return Promise.reject(new Error('Error while inserting data in token_users table.'));
    }

    insertData.id = insertResponse.insertId;

    let formattedInsertData = new TokenUserModel().formatDbData(insertData);
    await TokenUserModel.flushCache(formattedInsertData);

    logger.log('End::Creating token user');
    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Service response.
   *
   * @return {Promise<void>}
   * @private
   */
  async _serviceResponse1() {
    const oThis = this;

    const promisesArray = [];

    promisesArray.push(new SecureUserCache({ id: oThis.userId }).fetch());
    promisesArray.push(new TokenUserDetailByUserIdsCache({ userIds: [oThis.userId] }).fetch());

    const promisesArrayResponse = await Promise.all(promisesArray);

    const secureUserRes = promisesArrayResponse[0];
    const tokenUserRes = promisesArrayResponse[1];

    const secureUser = secureUserRes.data,
      tokenUser = tokenUserRes.data[oThis.userId];
  }

  /**
   * Service response.
   *
   * @return {Promise<void>}
   * @private
   */
  async _serviceResponse() {
    const oThis = this;

    const userLoginCookieValue = new UserModel().getCookieValueFor(oThis.secureUserObj, {
      timestamp: Date.now() / 1000
    });

    return responseHelper.successWithData({
      user: new UserModel().safeFormattedData(oThis.secureUserObj),
      tokenUser: new TokenUserModel().safeFormattedData(oThis.tokenUserObj),
      userLoginCookieValue: userLoginCookieValue
    });
  }
}

module.exports = TwitterConnect;
