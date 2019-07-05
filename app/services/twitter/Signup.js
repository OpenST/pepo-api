const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  KmsWrapper = require(rootPrefix + '/lib/aws/KmsWrapper'),
  CreateImage = require(rootPrefix + '/lib/user/image/Create'),
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
  UserByUsernameCache = require(rootPrefix + '/lib/cacheManagement/single/UserByUsername'),
  TwitterUserExtendedModel = require(rootPrefix + '/app/models/mysql/TwitterUserExtended'),
  TwitterUserModel = require(rootPrefix + '/app/models/mysql/TwitterUser'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  twitterUserExtendedConstants = require(rootPrefix + '/lib/globalConstant/twitterUserExtended'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  imageConstants = require(rootPrefix + '/lib/globalConstant/image'),
  userProfileElementConstants = require(rootPrefix + '/lib/globalConstant/userProfileElement.js'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  kmsGlobalConstant = require(rootPrefix + '/lib/globalConstant/kms'),
  ostPlatformSdk = require(rootPrefix + '/lib/ostPlatform/jsSdkWrapper'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  tokenUserConstants = require(rootPrefix + '/lib/globalConstant/tokenUser');

/**
 * Class for Twitter Signup service.
 *
 * @class TwitterConnect
 */
class TwitterSignup extends ServiceBase {
  /**
   * Constructor for signup service.
   *
   * @param {object} params
   * @param {string} params.twitterUserObj: Twitter User Table Obj
   * @param {string} params.userTwitterEntity: User Entity Of Twitter
   * @param {string} params.token: Oauth User Token
   * @param {string} params.secret: Oauth User secret
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.twitterUserObj = params.twitterUserObj;
    oThis.userTwitterEntity = params.userTwitterEntity;
    oThis.token = params.token;
    oThis.secret = params.secret;

    oThis.userId = null;

    oThis.secureUserObj = null;
    oThis.tokenUserObj = null;

    oThis.encryptedEncryptionSalt = null;
    oThis.decryptedEncryptionSalt = null;
    oThis.encryptedCookieToken = null;
    oThis.encryptedScryptSalt = null;
    oThis.encryptedSecret = null;

    oThis.userName = null;
    oThis.profileImageId = null;

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

    await oThis._performSignup();

    return Promise.resolve(oThis._serviceResponse());
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

    let promiseArray3 = [];
    promiseArray3.push(oThis.twitterSpecificFunction());

    promiseArray3.push(
      promiseResp.then(function(a) {
        return oThis._createTokenUser();
      })
    );

    await Promise.all(promiseArray3);

    logger.log('End::Perform Twitter Signup');

    return responseHelper.successWithData({});
  }

  /**
   *
   * @returns {Promise<void>}
   */
  async twitterSpecificFunction() {
    const oThis = this;
    await oThis._createUpdateTwitterUser();
    await oThis._createTwitterUserExtended();
  }

  /**
   * This function saves original profile image url given by twitter
   *
   * @returns {Promise<void>}
   * @private
   */
  async _saveProfileImage() {
    const oThis = this;
    logger.log('Start::Save Profile Image');

    if (oThis.userTwitterEntity.nonDefaultprofileImageUrl) {
      oThis.profileImageId = 1;
    }

    logger.log('End::Save Profile Image');
  }

  /**
   * Sets username
   *
   * @returns {Promise<void>}
   * @private
   */
  async _setUserName() {
    const oThis = this;
    logger.log('Start::Set User Name');

    let twitterHandle = oThis.userTwitterEntity.handle,
      uniqueUserName = twitterHandle,
      retryCount = 3;

    while (retryCount > 0) {
      let cacheResponse = await new UserByUsernameCache({ userName: uniqueUserName }).fetch();

      if (cacheResponse.isFailure()) {
        return Promise.reject(cacheResponse);
      }

      if (cacheResponse.data[uniqueUserName]) {
        uniqueUserName = twitterHandle + basicHelper.getRandomAlphaNumericString();
        retryCount--;
      } else {
        oThis.userName = uniqueUserName;
        break;
      }
    }

    if (!oThis.userName) {
      logger.error('Unique username not found.');
      const errorObject = responseHelper.error({
        internal_error_identifier: 'a_s_t_s_1',
        api_error_identifier: 'something_went_wrong',
        debug_options: {
          twitterHandle: twitterHandle
        }
      });

      await createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);
    }
    logger.log('End::Set User Name');
  }

  /**
   * Generate Data Key from KMS.
   *
   * @sets oThis.encryptedEncryptionSalt, oThis.decryptedEncryptionSalt
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

    oThis.decryptedEncryptionSalt = kmsResp.Plaintext;
    oThis.encryptedEncryptionSalt = kmsResp.CiphertextBlob;

    let scryptSalt = localCipher.generateRandomIv(32);
    let cookieToken = localCipher.generateRandomIv(32);

    oThis.encryptedScryptSalt = localCipher.encrypt(oThis.decryptedEncryptionSalt, scryptSalt);
    oThis.encryptedCookieToken = localCipher.encrypt(oThis.decryptedEncryptionSalt, cookieToken);
    oThis.encryptedSecret = localCipher.encrypt(oThis.decryptedEncryptionSalt, oThis.secret);

    logger.log('End::Generate Data Key from KMS');
    return responseHelper.successWithData({});
  }

  /**
   * Create user in ost.
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

    logger.log('End::Creating user in OST: ', oThis.ostStatus);

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

    let propertyVal = new UserModel().setBitwise('properties', 0, userConstants.hasTwitterLoginProperty);

    let insertData = {
      user_name: oThis.userName,
      name: oThis.userTwitterEntity.formattedName,
      cookie_token: oThis.encryptedCookieToken,
      encryption_salt: oThis.encryptedEncryptionSalt,
      mark_inactive_trigger_count: 0,
      properties: propertyVal,
      status: userConstants.invertedStatuses[userConstants.activeStatus],
      profile_image_id: oThis.profileImageId
    };
    // Insert user in database.
    const insertResponse = await new UserModel().insert(insertData).fire();

    if (!insertResponse) {
      logger.error('Error while inserting data in users table.');
      return Promise.reject(new Error('Error while inserting data in users table.'));
    }

    insertData.id = insertResponse.insertId;

    oThis.secureUserObj = new UserModel().formatDbData(insertData);

    await UserModel.flushCache(oThis.secureUserObj);

    oThis.userId = oThis.secureUserObj.id;

    logger.log('End::Create user');
    return responseHelper.successWithData({});
  }

  /**
   * Create Twitter User Extended Obj.
   *
   * @return {Promise<void>}
   * @private
   */
  async _createTwitterUserExtended() {
    const oThis = this;

    logger.log('Start::Create Twitter User Extended Obj', oThis.twitterUserObj);

    let insertData = {
      twitter_user_id: oThis.twitterUserObj.id,
      token: oThis.token,
      secret: oThis.encryptedSecret,
      status: twitterUserExtendedConstants.invertedStatuses[twitterUserExtendedConstants.activeStatus]
    };
    // Insert user in database.
    const insertResponse = await new TwitterUserExtendedModel().insert(insertData).fire();

    if (!insertResponse) {
      logger.error('Error while inserting data in twitter users extended table.');
      return Promise.reject(new Error('Error while inserting data in twitter users extended table.'));
    }

    insertData.id = insertResponse.insertId;

    let twitterUserExtendedObj = new TwitterUserExtendedModel().formatDbData(insertData);
    await TwitterUserExtendedModel.flushCache(twitterUserExtendedObj);

    logger.log('End::Create Twitter User Extended Obj');

    return responseHelper.successWithData({});
  }

  /**
   * Create or Update Twitter User Obj.
   *
   * @return {Promise<void>}
   * @private
   */
  async _createUpdateTwitterUser() {
    const oThis = this;

    logger.log('Start::Create/Update Twitter User Obj');

    if (oThis.twitterUserObj) {
      await new TwitterUserModel()
        .update({
          user_id: oThis.userId
        })
        .where({ id: oThis.twitterUserObj.id })
        .fire();

      oThis.twitterUserObj.userId = oThis.userId;
    } else {
      let twitterEmail = oThis.userTwitterEntity.email;

      if (!oThis.userTwitterEntity.email || !CommonValidators.isValidEmail(oThis.userTwitterEntity.email)) {
        twitterEmail = null;
      }

      let insertData = {
        twitter_id: oThis.userTwitterEntity.idStr,
        user_id: oThis.userId,
        name: oThis.userTwitterEntity.formattedName,
        email: twitterEmail,
        profile_image_url: oThis.userTwitterEntity.nonDefaultprofileImageUrl
      };
      // Insert user in database.
      const insertResponse = await new TwitterUserModel().insert(insertData).fire();

      if (!insertResponse) {
        logger.error('Error while inserting data in twitter users table.');
        return Promise.reject(new Error('Error while inserting data in twitter users table.'));
      }

      insertData.id = insertResponse.insertId;

      oThis.twitterUserObj = new TwitterUserModel().formatDbData(insertData);
    }

    await TwitterUserModel.flushCache(oThis.twitterUserObj);

    logger.log('End::Create/Update Twitter User Obj');
    return responseHelper.successWithData({});
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

    logger.log('Start::Creating token user', oThis.ostStatus);

    let insertData = {
      user_id: oThis.userId,
      ost_user_id: oThis.ostUserId,
      ost_token_holder_address: null,
      scrypt_salt: oThis.encryptedScryptSalt,
      properties: 0,
      ost_status: tokenUserConstants.invertedOstStatuses[oThis.ostStatus]
    };
    // Insert token user in database.
    const insertResponse = await new TokenUserModel().insert(insertData).fire();

    if (!insertResponse) {
      logger.error('Error while inserting data in token_users table.');
      return Promise.reject(new Error('Error while inserting data in token_users table.'));
    }

    insertData.id = insertResponse.insertId;

    oThis.tokenUserObj = new TokenUserModel().formatDbData(insertData);
    await TokenUserModel.flushCache(oThis.tokenUserObj);

    logger.log('End::Creating token user', oThis.ostStatus);
    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Service response.
   *
   * @return {Promise<void>}
   * @private
   */
  async _serviceResponse() {
    const oThis = this;

    logger.log('Start::Service Response for twitter Signup');

    const userLoginCookieValue = new UserModel().getCookieValueFor(oThis.secureUserObj, oThis.decryptedEncryptionSalt, {
      timestamp: Date.now() / 1000
    });

    logger.log('End::Service Response for twitter Signup');

    return responseHelper.successWithData({
      user: new UserModel().safeFormattedData(oThis.secureUserObj),
      tokenUser: new TokenUserModel().safeFormattedData(oThis.tokenUserObj),
      userLoginCookieValue: userLoginCookieValue
    });
  }
}

module.exports = TwitterSignup;
