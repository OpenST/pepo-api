const rootPrefix = '../../..',
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
  SecureUserCache = require(rootPrefix + '/lib/cacheManagement/single/SecureUser'),
  UserUniqueIdentifierModel = require(rootPrefix + '/app/models/mysql/UserIdentifier'),
  ImageByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/ImageByIds'),
  UserIdentifiersByEmailsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserIdentifiersByEmails'),
  TokenUserDetailByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  imageLib = require(rootPrefix + '/lib/imageLib'),
  imageConstants = require(rootPrefix + '/lib/globalConstant/image'),
  userProfileElementConst = require(rootPrefix + '/lib/globalConstant/userProfileElement'),
  UserProfileElementsByUserIdCache = require(rootPrefix + '/lib/cacheManagement/multi/UserProfileElementsByUserIds'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob');

class LoginConnectBase {
  /**
   * Login connect base constructor.
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.isNewSocialConnect = params.isNewSocialConnect;

    oThis.secureUserObj = null;
    oThis.tokenUserObj = null;

    oThis.decryptedEncryptionSalt = null;
    oThis.profileImageId = null;
    oThis.imageMap = {};
  }

  /**
   * Perform.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    logger.log('Start::perform LoginConnectBase');

    await oThis._checkIfInsertionRequiredForLogin();

    await oThis._fetchSecureUser();

    await oThis._createUpdateSocialUserExtended();

    const promisesArray = [];

    promisesArray.push(oThis._fetchImages());
    promisesArray.push(oThis._fetchTokenUser());
    promisesArray.push(oThis._syncDataInSocialUsers());
    promisesArray.push(oThis._insertUserUniqueIdentifier());
    promisesArray.push(oThis._syncNewConnectedAccount());
    promisesArray.push(oThis._updateUserProperties());

    await Promise.all(promisesArray);

    logger.log('End::perform LoginConnectBase');

    return Promise.resolve(oThis._prepareResponse());
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

    oThis.decryptedEncryptionSalt = localCipher.decrypt(
      coreConstants.CACHE_SHA_KEY,
      oThis.secureUserObj.encryptionSaltLc
    );

    logger.log('End::Fetching Secure User for Twitter login');

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
   * Insert user unique identifier
   *
   * @returns {Promise<void>}
   * @private
   */
  async _insertUserUniqueIdentifier() {
    const oThis = this;

    // Fetch email from social user entity and user idt table.
    const socialEmail = oThis._getUserSocialEmail();

    if (socialEmail) {
      const userIdentifiersByEmailsCacheRsp = await new UserIdentifiersByEmailsCache({ emails: [socialEmail] }).fetch();

      if (!userIdentifiersByEmailsCacheRsp || userIdentifiersByEmailsCacheRsp.isFailure()) {
        return Promise.reject(userIdentifiersByEmailsCacheRsp);
      }

      const userIdentifiers = userIdentifiersByEmailsCacheRsp.data[socialEmail];

      // If record found do nothing, else insert valid email into user idt.
      if (!CommonValidators.validateNonEmptyObject(userIdentifiers) && CommonValidators.isValidEmail(socialEmail)) {
        await new UserUniqueIdentifierModel().insertUserEmail(oThis.userId, socialEmail);
        await UserUniqueIdentifierModel.flushCache({ emails: [socialEmail] });
      }
    }
  }

  /**
   * Fetch images.
   *
   * @sets oThis.imageMap
   *
   * @return {Promise<*>}
   * @private
   */
  async _fetchImages() {
    const oThis = this;

    if (!oThis.secureUserObj.profileImageId) {
      return;
    }

    let imageId = oThis.secureUserObj.profileImageId;

    const cacheRsp = await new ImageByIdCache({ ids: [imageId] }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    oThis.imageMap = cacheRsp.data;
  }

  /**
   * Prepare response.
   *
   * @return {Promise<void>}
   * @private
   */
  async _prepareResponse() {
    const oThis = this;

    logger.log('Start::Prepare Response for twitter Login');

    // NOTE - this cookie versioning has been introduced on 22/01/2020.
    const userLoginCookieValue = new UserModel().getCookieValueFor(oThis.secureUserObj, oThis.decryptedEncryptionSalt, {
      timestamp: Date.now() / 1000,
      loginServiceType: oThis._getServiceType()
    });

    logger.log('End::Prepare Response for twitter Login');

    const safeFormattedUserData = new UserModel().safeFormattedData(oThis.secureUserObj);
    const safeFormattedTokenUserData = new TokenUserModel().safeFormattedData(oThis.tokenUserObj);
    const safeFormattedSocialUserExtendedData = await oThis._fetchSocialUserExtended();

    return responseHelper.successWithData({
      usersByIdMap: { [safeFormattedUserData.id]: safeFormattedUserData },
      imageMap: oThis.imageMap,
      tokenUsersByUserIdMap: { [safeFormattedTokenUserData.userId]: safeFormattedTokenUserData },
      user: safeFormattedUserData,
      tokenUser: safeFormattedTokenUserData,
      userLoginCookieValue: userLoginCookieValue,
      meta: { isRegistration: 1, serviceType: oThis._getServiceType() },
      twitterUserExtended: safeFormattedSocialUserExtendedData
    });
  }

  /**
   * Get encrypted token for.
   *
   * @param string - Token string.
   * @returns
   *
   * @private
   */
  _getLCEncryptedToken(string) {
    const oThis = this;

    return localCipher.encrypt(oThis.decryptedEncryptionSalt, string);
  }

  /**
   * Check if insertion required for login.
   * NOTE - new type of social connect used for existing user.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _checkIfInsertionRequiredForLogin() {
    const oThis = this;

    // If User is already present, but new social platform is connected then entry would be created in social_users table.
    if (oThis.isNewSocialConnect) {
      await oThis._insertIntoSocialUsers();
    }
  }

  /**
   * Update social user extended tables.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _createUpdateSocialUserExtended() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Sync data in social users table.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _syncDataInSocialUsers() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Fetch social user extended data.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchSocialUserExtended() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Insert into social users.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _insertIntoSocialUsers() {
    throw new Error('Sub-class to implement.');
  }

  /**
   *  Get Social email of user from social entity
   *
   * @private
   */
  _getUserSocialEmail() {
    throw 'Sub-class to implement';
  }

  /**
   * Get login service type.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _getServiceType() {
    throw new Error('Sub-class to implement.');
  }

  /**
   * Sync new connected account, with changes
   *
   * @returns {Promise<void>}
   * @private
   */
  async _syncNewConnectedAccount() {
    const oThis = this;

    let messagePayload = oThis._appendTwitterParamsForSignupJob();

    let userBio = await oThis._fetchUserBio();
    if (!userBio) {
      messagePayload.bio = oThis._getSocialBio();
    }

    messagePayload.userId = oThis.userId;
    messagePayload.isCreator = UserModel.isUserApprovedCreator(oThis.secureUserObj);
    if (!oThis.secureUserObj.profileImageId) {
      await oThis._saveProfileImage();
    }
    messagePayload.profileImageId = oThis.profileImageId;
    messagePayload.isUserLogin = 1;
    await bgJob.enqueue(bgJobConstants.afterSignUpJobTopic, messagePayload);
  }

  /**
   * Append twitter Id
   *
   * @returns {{}}
   * @private
   */
  _appendTwitterParamsForSignupJob() {
    return {};
  }

  /**
   * Fetch user bio if present
   *
   * @returns {Promise<null|*>}
   * @private
   */
  async _fetchUserBio() {
    const oThis = this;

    const cacheRsp = await new UserProfileElementsByUserIdCache({ usersIds: oThis.userId }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }
    let profileElementsData = cacheRsp.data[oThis.userId];
    for (let kind in profileElementsData) {
      if (kind == userProfileElementConst.bioIdKind) {
        return profileElementsData[kind].data;
      }
    }

    return null;
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

    let profileImageUrl = oThis._getProfileImageUrl();

    if (profileImageUrl) {
      const imageLibResp = await imageLib.validateAndSave({
        imageUrl: profileImageUrl,
        isExternalUrl: true,
        kind: imageConstants.profileImageKind,
        enqueueResizer: false
      });

      if (imageLibResp.isFailure()) {
        return Promise.reject(imageLibResp);
      }

      oThis.profileImageId = imageLibResp.data.insertId;
      oThis.secureUserObj.profileImageId = oThis.profileImageId;
      await new UserModel()
        .update(['profile_image_id = ?', oThis.profileImageId])
        .where({ id: oThis.userId })
        .fire();
      await UserModel.flushCache({ id: oThis.userId });
      logger.log('End::Save Profile Image');
    }
  }

  /**
   * Get profile image
   *
   * @private
   */
  _getProfileImageUrl() {
    throw 'Sub-class to implement';
  }

  /**
   * Update User properties for new connect
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateUserProperties() {
    const oThis = this;

    // In case of new social connect, update user property for new account connection
    if (oThis.isNewSocialConnect) {
      const propertyVal = userConstants.invertedProperties[oThis._getSocialAccountLoginProperty()];

      await new UserModel()
        .update(['properties = properties | ?', propertyVal])
        .where({ id: oThis.userId })
        .fire();

      await UserModel.flushCache({ id: oThis.userId });
    }
  }

  /**
   * Get social account login property to be updated
   *
   * @private
   */
  _getSocialAccountLoginProperty() {
    throw 'Sub-class to implement';
  }
}

module.exports = LoginConnectBase;
