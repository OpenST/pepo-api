const rootPrefix = '../../..',
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  TokenUserModel = require(rootPrefix + '/app/models/mysql/TokenUser'),
  SecureUserCache = require(rootPrefix + '/lib/cacheManagement/single/SecureUser'),
  TokenUserDetailByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  UserUniqueIdentifierModel = require(rootPrefix + '/app/models/mysql/UserIdentifier'),
  coreConstants = require(rootPrefix + '/config/coreConstants');

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

    promisesArray.push(oThis._fetchTokenUser());
    promisesArray.push(oThis._syncDataInSocialUsers());
    promisesArray.push(oThis._insertUserUniqueIdentifier());

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
   * Prepare response.
   *
   * @return {Promise<void>}
   * @private
   */
  async _prepareResponse() {
    const oThis = this;

    logger.log('Start::Prepare Response for twitter Login');

    // todo - dhananjay - move this to service layer.
    const userLoginCookieValue = new UserModel().getCookieValueFor(oThis.secureUserObj, oThis.decryptedEncryptionSalt, {
      timestamp: Date.now() / 1000
    });

    logger.log('End::Prepare Response for twitter Login');

    const safeFormattedUserData = new UserModel().safeFormattedData(oThis.secureUserObj);
    const safeFormattedTokenUserData = new TokenUserModel().safeFormattedData(oThis.tokenUserObj);
    const safeFormattedSocialUserExtendedData = await oThis._fetchSocialUserExtended();

    return responseHelper.successWithData({
      usersByIdMap: { [safeFormattedUserData.id]: safeFormattedUserData },
      tokenUsersByUserIdMap: { [safeFormattedTokenUserData.userId]: safeFormattedTokenUserData },
      user: safeFormattedUserData,
      tokenUser: safeFormattedTokenUserData,
      userLoginCookieValue: userLoginCookieValue,
      twitterUserExtended: safeFormattedSocialUserExtendedData // todo - dhananjay - rename this key name.
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
    } else {
      await oThis._updateSocialUsers();
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
   * Update social users.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateSocialUsers() {
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
   * Insert user unique identifier
   *
   * @returns {Promise<void>}
   * @private
   */
  async _insertUserUniqueIdentifier() {
    const oThis = this;

    let socialEmail = oThis._getUserSocialEmail();
    // If new social account is added for user, then only insert unique identifier
    if (oThis.isNewSocialConnect && socialEmail) {
      await new UserUniqueIdentifierModel().insertUserEmail(oThis.userId, socialEmail);
    }
  }
}

module.exports = LoginConnectBase;
