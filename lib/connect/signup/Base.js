const uuidV4 = require('uuid/v4');

const rootPrefix = '../../..',
  KmsWrapper = require(rootPrefix + '/lib/aws/KmsWrapper'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
  UserByEmailCache = require(rootPrefix + '/lib/cacheManagement/multi/UserByEmails'),
  UserIdByUserNamesCache = require(rootPrefix + '/lib/cacheManagement/multi/UserIdByUserNames'),
  imageLib = require(rootPrefix + '/lib/imageLib'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  imageConstants = require(rootPrefix + '/lib/globalConstant/image'),
  kmsGlobalConstant = require(rootPrefix + '/lib/globalConstant/kms'),
  ostPlatformSdk = require(rootPrefix + '/lib/ostPlatform/jsSdkWrapper'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  tokenUserConstants = require(rootPrefix + '/lib/globalConstant/tokenUser'),
  UserUniqueIdentifierModel = require(rootPrefix + '/app/models/mysql/UserIdentifier'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs');

/**
 * Class for signup base.
 *
 * @class SignupBase
 */
class SignupBase {
  /**
   * Constructor for signup class.
   *
   * @param {object} params
   * @param {string} params.secret: Oauth User secret
   *
   * @param {string} params.inviterCodeId: invite code table id of inviter
   * @param {object} params.utmParams: utm params used while signup.
   * @param {object} params.sanitizedHeaders: sanitized headers.
   * @param {string} [params.inviteCode:] invite code.
   *
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.inviterCodeId = params.inviterCodeId;
    oThis.utmParams = params.utmParams || {};
    oThis.inviteCode = params.inviteCode || '';

    oThis.userId = null;
    oThis.userObj = null;

    oThis.encryptedEncryptionSalt = null;
    oThis.decryptedEncryptionSalt = null;

    oThis.userName = null;
    oThis.profileImageId = null;

    oThis.ostUserId = null;
    oThis.ostStatus = null;
    oThis.userOptedInEmail = null;
  }

  /**
   * Async perform.
   *
   * @returns {Promise<void>}
   * @private
   */
  async perform() {
    const oThis = this;

    logger.log('Start::Perform Signup Base');

    // Starting the create user in ost in parallel.
    const createOstUserPromise = oThis._createUserInOst();

    const promisesArray1 = [
      oThis._saveProfileImage(),
      oThis._setUserName(),
      oThis._emailToSet(),
      oThis._setKMSEncryptionSalt()
    ];

    await Promise.all(promisesArray1).catch(function(err) {
      logger.error('Error in _performSignup: ', err);

      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_c_su_b_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: {}
        })
      );
    });

    await oThis._createUser();

    const promiseArray2 = [
      oThis._createSocialUserRecords(),
      oThis._insertUserIdentifier(),
      createOstUserPromise.then(function() {
        return oThis._createTokenUser();
      })
    ];
    await Promise.all(promiseArray2);

    await oThis._enqueueAfterSignupJob();

    logger.log('End::Perform Twitter Signup');

    return oThis._prepareResponse();
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

    let a = Date.now();

    logger.log('Start::Creating user in OST', a);

    const createUserServiceResponse = await ostPlatformSdk.createUser();
    if (!createUserServiceResponse.isSuccess()) {
      await createErrorLogsEntry.perform(createUserServiceResponse, errorLogsConstants.highSeverity);
      return Promise.reject(createUserServiceResponse);
    }

    oThis.ostUserId = createUserServiceResponse.data.user.id;
    oThis.ostStatus = createUserServiceResponse.data.user.status;

    logger.log('End::Creating user in OST: ', Date.now() - a);

    return responseHelper.successWithData({});
  }

  /**
   * This function saves original profile image url.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _saveProfileImage() {
    const oThis = this;
    logger.log('Start::Save Profile Image');

    oThis.profileImageUrl = oThis._getProfileImageUrl();

    if (oThis.profileImageUrl) {
      const imageLibResp = await imageLib.validateAndSave({
        imageUrl: oThis.profileImageUrl,
        isExternalUrl: true,
        kind: imageConstants.profileImageKind,
        enqueueResizer: false
      });

      if (imageLibResp.isFailure()) {
        return Promise.reject(imageLibResp);
      }

      oThis.profileImageId = imageLibResp.data.insertId;
      logger.log('End::Save Profile Image');
    }
  }

  /**
   * Get profile image url.
   *
   * @private
   */
  _getProfileImageUrl() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Sets username.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _setUserName() {
    const oThis = this;
    logger.log('Start::Set User Name');

    let uniqueUserName = oThis._getSocialUserName(),
      retryCount = 3;

    while (retryCount > 0) {
      let cacheResponse = await new UserIdByUserNamesCache({ userNames: [uniqueUserName] }).fetch();

      if (cacheResponse.isFailure()) {
        return Promise.reject(cacheResponse);
      }

      if (cacheResponse.data[uniqueUserName].id) {
        uniqueUserName = basicHelper.getUniqueUserName(uniqueUserName);
        retryCount--;
      } else {
        oThis.userName = uniqueUserName;
        break;
      }
    }

    if (!oThis.userName) {
      logger.error('Unique username not found.');

      const errorObject = responseHelper.error({
        internal_error_identifier: 'l_c_su_bt_1',
        api_error_identifier: 'something_went_wrong',
        debug_options: {
          userName: uniqueUserName
        }
      });

      await createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);
      return Promise.reject(errorObject);
    }

    logger.log('End::Set User Name');
  }

  /**
   * Get social user name.
   *
   * @private
   */
  _getSocialUserName() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Email of user to set
   *
   * @Sets oThis.userOptedInEmail
   *
   * @returns {Promise<*>}
   * @private
   */
  async _emailToSet() {
    const oThis = this;

    oThis.userOptedInEmail = oThis._getSocialAccountEmail();

    // Check if that email is already used or not.
    if (oThis.userOptedInEmail) {
      let emailCacheResp = await new UserByEmailCache({ emails: [oThis.userOptedInEmail] }).fetch();
      if (CommonValidators.validateNonEmptyObject(emailCacheResp.data[oThis.userOptedInEmail])) {
        // Email is already used, so cannot be added.
        oThis.userOptedInEmail = null;
      }
    }
  }

  /**
   * Get email from social account entity.
   *
   * @private
   */
  _getSocialAccountEmail() {
    throw new Error('Sub-class to implement.');
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

    logger.log('End::Generate Data Key from KMS');
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

    logger.log('Start::Create user Base');

    let cookieToken = localCipher.generateRandomIv(32),
      encryptedCookieToken = localCipher.encrypt(oThis.decryptedEncryptionSalt, cookieToken);

    let insertData = {
      user_name: oThis.userName,
      name: oThis._getSocialAccountName(),
      cookie_token: encryptedCookieToken,
      encryption_salt: oThis.encryptedEncryptionSalt,
      mark_inactive_trigger_count: 0,
      properties: oThis._userPropertiesToSet(),
      status: userConstants.invertedStatuses[userConstants.activeStatus],
      profile_image_id: oThis.profileImageId,
      email: oThis.userOptedInEmail,
      external_user_id: uuidV4()
    };

    let retryCount = 3,
      caughtInException = true,
      insertResponse = null;

    while (retryCount > 0 && caughtInException) {
      // Insert user in database.
      retryCount--;
      caughtInException = false;

      insertResponse = await new UserModel()
        .insert(insertData)
        .fire()
        .catch(function(err) {
          logger.log('Error while inserting user data: ', err);
          if (UserModel.isDuplicateIndexViolation(UserModel.usernameUniqueIndexName, err)) {
            logger.log('Username conflict. Attempting with a modified username.');
            caughtInException = true;
            insertData.user_name = basicHelper.getUniqueUserName(oThis.userName);
            return null;
          } else {
            return Promise.reject(err);
          }
        });
    }

    if (!insertResponse) {
      logger.error('Error while inserting data in users table.');
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_t_s_cu_2',
          api_error_identifier: 'something_went_wrong',
          debug_options: {
            insertData: insertData
          }
        })
      );
    }

    insertData.id = insertResponse.insertId;

    Object.assign(insertData, insertResponse.defaultUpdatedAttributes);

    oThis.userObj = new UserModel().formatDbData(insertData);

    await UserModel.flushCache(oThis.userObj);

    oThis.userId = oThis.userObj.id;

    logger.log('End::Create user');

    return responseHelper.successWithData({});
  }

  /**
   * Properties to set for user
   *
   * @returns {number}
   * @private
   */
  _userPropertiesToSet() {
    const oThis = this;

    let propertyVal = new UserModel().setBitwise('properties', 0, oThis._getSocialAccountLoginProperty());

    // Till user uploads video, its denied to be creator.
    propertyVal = new UserModel().setBitwise('properties', propertyVal, userConstants.isDeniedCreatorProperty);

    return propertyVal;
  }

  /**
   * Get social account login property.
   *
   * @returns {String}
   * @private
   */
  _getSocialAccountLoginProperty() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Get social account name.
   *
   * @private
   */
  _getSocialAccountName() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Create or update social connect tables.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _createSocialUserRecords() {
    throw new Error('Sub-class to implement.');
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

    let scryptSalt = localCipher.generateRandomIv(32),
      encryptedScryptSalt = localCipher.encrypt(oThis.decryptedEncryptionSalt, scryptSalt);

    let insertData = {
      user_id: oThis.userId,
      ost_user_id: oThis.ostUserId,
      ost_token_holder_address: null,
      scrypt_salt: encryptedScryptSalt,
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
    Object.assign(insertData, insertResponse.defaultUpdatedAttributes);

    oThis.tokenUserObj = new TokenUserModel().formatDbData(insertData);
    await TokenUserModel.flushCache(oThis.tokenUserObj);

    logger.log('End::Creating token user');
    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Enqueue after sign-up job.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _enqueueAfterSignupJob() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Insert user identifier if email is present
   *
   * @returns {Promise<void>}
   * @private
   */
  async _insertUserIdentifier() {
    const oThis = this;

    if (oThis.userOptedInEmail) {
      await new UserUniqueIdentifierModel().insertUserEmail(oThis.userId, oThis.userOptedInEmail);
    }
  }

  /**
   * Prepare response.
   *
   * @return {Promise<void>}
   * @private
   */
  async _prepareResponse() {
    const oThis = this;

    logger.log('Start::Service Response for twitter Signup');

    const userLoginCookieValue = new UserModel().getCookieValueFor(oThis.userObj, oThis.decryptedEncryptionSalt, {
      timestamp: Date.now() / 1000
    });

    logger.log('End::Service Response for twitter Signup');

    const safeFormattedUserData = new UserModel().safeFormattedData(oThis.userObj);
    const safeFormattedTokenUserData = new TokenUserModel().safeFormattedData(oThis.tokenUserObj);

    return responseHelper.successWithData({
      usersByIdMap: { [safeFormattedUserData.id]: safeFormattedUserData },
      tokenUsersByUserIdMap: { [safeFormattedTokenUserData.userId]: safeFormattedTokenUserData },
      user: safeFormattedUserData,
      tokenUser: safeFormattedTokenUserData,
      userLoginCookieValue: userLoginCookieValue,
      openEmailAddFlow: oThis.userOptedInEmail ? 0 : 1,
      utmParams: oThis.utmParams,
      meta: { isRegistration: 1, inviteCode: oThis.inviteCode }
    });
  }
}

module.exports = SignupBase;
