const uuidV4 = require('uuid/v4');

const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  KmsWrapper = require(rootPrefix + '/lib/aws/KmsWrapper'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  imageLib = require(rootPrefix + '/lib/imageLib'),
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
  UserIdByUserNamesCache = require(rootPrefix + '/lib/cacheManagement/multi/UserIdByUserNames'),
  TwitterUserExtendedModel = require(rootPrefix + '/app/models/mysql/TwitterUserExtended'),
  TwitterUserModel = require(rootPrefix + '/app/models/mysql/TwitterUser'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob'),
  twitterUserExtendedConstants = require(rootPrefix + '/lib/globalConstant/twitterUserExtended'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  imageConstants = require(rootPrefix + '/lib/globalConstant/image'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  kmsGlobalConstant = require(rootPrefix + '/lib/globalConstant/kms'),
  ostPlatformSdk = require(rootPrefix + '/lib/ostPlatform/jsSdkWrapper'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  tokenUserConstants = require(rootPrefix + '/lib/globalConstant/tokenUser'),
  UserByEmailCache = require(rootPrefix + '/lib/cacheManagement/multi/UserByEmails'),
  prelaunchInviteConstants = require(rootPrefix + '/lib/globalConstant/preLaunchInvite');

/**
 * Class for twitter signup service.
 *
 * @class TwitterConnect
 */
class TwitterSignup extends ServiceBase {
  /**
   * Constructor for twitter signup service.
   *
   * @param {object} params
   * @param {string} params.twitterUserObj: Twitter User Table Obj
   * @param {string} params.userTwitterEntity: User Entity Of Twitter
   * @param {string} params.token: Oauth User Token
   * @param {string} params.secret: Oauth User secret
   * @param {Object} params.twitterRespHeaders: Headers sent by twitter
   *
   * @param {string} params.inviterCodeId: invite code table id of inviter
   * @param {object} params.prelaunchInviteObj: prelaunch invite object, if user was part of pre-launch program
   * @param {object} params.utmParams: utm params used while signup.
   * @param {object} params.sanitizedHeaders: sanitized headers.
   * @param {string} [params.inviteCode:] invite code.
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.twitterUserObj = params.twitterUserObj;
    oThis.userTwitterEntity = params.userTwitterEntity;
    oThis.token = params.token;
    oThis.secret = params.secret;
    oThis.inviterCodeId = params.inviterCodeId;
    oThis.twitterRespHeaders = params.twitterRespHeaders;
    oThis.prelaunchInviteObj = params.prelaunchInviteObj || {};
    oThis.utmParams = params.utmParams || {};
    oThis.sanitizedHeaders = params.sanitizedHeaders;
    oThis.inviteCode = params.inviteCode || '';

    oThis.userId = null;

    oThis.userObj = null;
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
    oThis.userOptedInEmail = null;
    oThis.twitterUserExtended = null;
  }

  /**
   * Async perform.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._performSignup();

    return oThis._serviceResponse();
  }

  /**
   * Perform signup via twitter.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _performSignup() {
    const oThis = this;

    logger.log('Start::Perform Twitter Signup');

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
          internal_error_identifier: 's_t_s_ps_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: {}
        })
      );
    });

    await oThis._createUser();

    const promiseArray2 = [
      oThis._twitterSpecificFunction(),
      createOstUserPromise.then(function() {
        return oThis._createTokenUser();
      })
    ];
    await Promise.all(promiseArray2);

    await oThis._enqueAfterSignupJob();

    logger.log('End::Perform Twitter Signup');

    return responseHelper.successWithData({});
  }

  /**
   * Create or update twitter user.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _twitterSpecificFunction() {
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

    if (!oThis.userTwitterEntity.nonDefaultProfileImageUrl) {
      oThis.profileImageId = null;
      logger.log('End::Save Profile Image. Default twitter profile pic.');
      return;
    }

    let resp = await imageLib.validateAndSave({
      imageUrl: oThis.userTwitterEntity.nonDefaultProfileImageUrl,
      isExternalUrl: true,
      kind: imageConstants.profileImageKind,
      enqueueResizer: false
    });
    if (resp.isFailure()) {
      return Promise.reject(resp);
    }

    oThis.profileImageId = resp.data.insertId;

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
        internal_error_identifier: 'a_s_t_s_1',
        api_error_identifier: 'something_went_wrong',
        debug_options: {
          twitterHandle: twitterHandle
        }
      });

      await createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);

      return Promise.reject(errorObject);
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

    let insertData = {
      user_name: oThis.userName,
      name: oThis.userTwitterEntity.formattedName,
      cookie_token: oThis.encryptedCookieToken,
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
   * Create Twitter User Extended Obj.
   *
   * @return {Promise<void>}
   * @private
   */
  async _createTwitterUserExtended() {
    const oThis = this;

    logger.log('Start::Create Twitter User Extended Obj');

    let accessType = twitterUserExtendedConstants.getAccessLevelFromTwitterHeader(oThis.twitterRespHeaders);

    let insertData = {
      twitter_user_id: oThis.twitterUserObj.id,
      user_id: oThis.userId,
      token: oThis.token,
      secret: oThis.encryptedSecret,
      access_type: twitterUserExtendedConstants.invertedAccessTypes[accessType],
      status: twitterUserExtendedConstants.invertedStatuses[twitterUserExtendedConstants.activeStatus]
    };
    // Insert user in database.
    const insertResponse = await new TwitterUserExtendedModel().insert(insertData).fire();

    if (!insertResponse) {
      logger.error('Error while inserting data in twitter users extended table.');
      return Promise.reject(new Error('Error while inserting data in twitter users extended table.'));
    }

    insertData.id = insertResponse.insertId;
    Object.assign(insertData, insertResponse.defaultUpdatedAttributes);

    oThis.twitterUserExtended = new TwitterUserExtendedModel().formatDbData(insertData);
    await TwitterUserExtendedModel.flushCache(oThis.twitterUserExtended);

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

    let twitterHandle = oThis.userTwitterEntity.handle;

    if (oThis.twitterUserObj) {
      await new TwitterUserModel()
        .update({
          user_id: oThis.userId,
          handle: twitterHandle
        })
        .where({ id: oThis.twitterUserObj.id })
        .fire();

      oThis.twitterUserObj.userId = oThis.userId;
    } else {
      let twitterEmail = oThis.userTwitterEntity.email;

      // email info is not mandatory to come from twitter.
      if (!oThis.userTwitterEntity.email || !CommonValidators.isValidEmail(oThis.userTwitterEntity.email)) {
        twitterEmail = null;
      }

      let insertData = {
        twitter_id: oThis.userTwitterEntity.idStr,
        user_id: oThis.userId,
        name: oThis.userTwitterEntity.formattedName,
        email: twitterEmail,
        handle: twitterHandle,
        profile_image_url: oThis.userTwitterEntity.nonDefaultProfileImageShortUrl
      };
      // Insert user in database.
      const insertResponse = await new TwitterUserModel().insert(insertData).fire();

      if (!insertResponse) {
        logger.error('Error while inserting data in twitter users table.');

        return Promise.reject(new Error('Error while inserting data in twitter users table.'));
      }

      insertData.id = insertResponse.insertId;
      Object.assign(insertData, insertResponse.defaultUpdatedAttributes);

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

    logger.log('Start::Creating token user');

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
    Object.assign(insertData, insertResponse.defaultUpdatedAttributes);

    oThis.tokenUserObj = new TokenUserModel().formatDbData(insertData);
    await TokenUserModel.flushCache(oThis.tokenUserObj);

    logger.log('End::Creating token user');
    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Enque after signup job.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _enqueAfterSignupJob() {
    const oThis = this;

    const messagePayload = {
      bio: oThis.userTwitterEntity.description,
      twitterUserId: oThis.twitterUserObj.id,
      twitterId: oThis.userTwitterEntity.idStr,
      userId: oThis.userId,
      profileImageId: oThis.profileImageId,
      inviterCodeId: oThis.inviterCodeId,
      userInviteCodeId: oThis.prelaunchInviteObj.inviteCodeId,
      isCreator: UserModel.isUserApprovedCreator(oThis.userObj),
      utmParams: oThis.utmParams,
      sanitizedHeaders: oThis.sanitizedHeaders
    };
    await bgJob.enqueue(bgJobConstants.afterSignUpJobTopic, messagePayload);
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

    const userLoginCookieValue = new UserModel().getCookieValueFor(oThis.userObj, oThis.decryptedEncryptionSalt, {
      timestamp: Date.now() / 1000
    });

    logger.log('End::Service Response for twitter Signup');

    const safeFormattedUserData = new UserModel().safeFormattedData(oThis.userObj);
    const safeFormattedTokenUserData = new TokenUserModel().safeFormattedData(oThis.tokenUserObj);
    const safeFormattedTwitterUserExtendedData = new TwitterUserExtendedModel().safeFormattedData(
      oThis.twitterUserExtended
    );

    return responseHelper.successWithData({
      usersByIdMap: { [safeFormattedUserData.id]: safeFormattedUserData },
      tokenUsersByUserIdMap: { [safeFormattedTokenUserData.userId]: safeFormattedTokenUserData },
      user: safeFormattedUserData,
      tokenUser: safeFormattedTokenUserData,
      userLoginCookieValue: userLoginCookieValue,
      openEmailAddFlow: oThis.userOptedInEmail ? 0 : 1,
      twitterUserExtended: safeFormattedTwitterUserExtendedData,
      utmParams: oThis.utmParams,
      meta: { isRegistration: 1, inviteCode: oThis.inviteCode }
    });
  }

  /**
   * Properties to set for user
   *
   * @returns {number}
   * @private
   */
  _userPropertiesToSet() {
    const oThis = this;

    let propertyVal = new UserModel().setBitwise('properties', 0, userConstants.hasTwitterLoginProperty);

    // If user was part of prelaunch program and was approved as creator
    if (
      CommonValidators.validateNonEmptyObject(oThis.prelaunchInviteObj) &&
      oThis.prelaunchInviteObj.creatorStatus == prelaunchInviteConstants.approvedCreatorStatus
    ) {
      propertyVal = new UserModel().setBitwise('properties', propertyVal, userConstants.isApprovedCreatorProperty);
    } else {
      // Till user uploads video, its denied to be creator.
      propertyVal = new UserModel().setBitwise('properties', propertyVal, userConstants.isDeniedCreatorProperty);
    }

    return propertyVal;
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

    // Check if email is received from twitter
    if (oThis.userTwitterEntity.email && CommonValidators.isValidEmail(oThis.userTwitterEntity.email)) {
      oThis.userOptedInEmail = oThis.userTwitterEntity.email;
    } else if (
      CommonValidators.validateNonEmptyObject(oThis.prelaunchInviteObj) &&
      oThis.prelaunchInviteObj.status == prelaunchInviteConstants.doptinStatus
    ) {
      // If user was part of prelaunch program and has double opted in for email, then use it
      oThis.userOptedInEmail = oThis.prelaunchInviteObj.email;
    }

    // Check if that email is already used or not
    if (oThis.userOptedInEmail) {
      let emailCacheResp = await new UserByEmailCache({ emails: [oThis.userOptedInEmail] }).fetch();
      if (CommonValidators.validateNonEmptyObject(emailCacheResp.data[oThis.userOptedInEmail])) {
        // Email is already used, so cannot be added.
        oThis.userOptedInEmail = null;
      }
    }
  }
}

module.exports = TwitterSignup;
