const rootPrefix = '../../..',
  LoginConnectBase = require(rootPrefix + '/lib/connect/login/Base'),
  AppleUserModel = require(rootPrefix + '/app/models/mysql/AppleUser'),
  AppleUserExtendedModel = require(rootPrefix + '/app/models/mysql/AppleUserExtended'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  socialConnectServiceTypeConstants = require(rootPrefix + '/lib/globalConstant/socialConnectServiceType'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

/**
 * Class for Apple Login service.
 *
 * @class LoginConnectByApple
 */
class LoginConnectByApple extends LoginConnectBase {
  /**
   * Constructor for Apple Login service.
   *
   * @param {object} params
   * @param {object} params.appleUserObj: Apple User Table Obj
   * @param {string} params.accessToken: Oauth User Token
   * @param {string} params.refreshToken: Oauth User Refresh Token
   * @param {object} params.appleUserEntity: User Entity Of Github
   * @param {string} params.userId: user id
   *
   * @augments LoginConnectBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.appleUserObj = params.appleUserObj;
    oThis.appleUserEntity = params.appleUserEntity;
    oThis.accessToken = params.accessToken;
    oThis.refreshToken = params.refreshToken;

    oThis.userId = params.userId;

    oThis.appleUserExtendedObj = null;
  }

  /**
   * Update Apple User Extended object.
   *
   * @sets oThis.appleUserExtendedObj
   *
   * @returns {Promise<void>}
   * @private
   */
  async _createUpdateSocialUserExtended() {
    const oThis = this;

    logger.log('Start::Update Apple User Extended for login', oThis.appleUserObj);

    oThis.appleUserExtendedObj = await new AppleUserExtendedModel().fetchByAppleUserId(oThis.appleUserObj.id);

    // If appleUserExtendedObj is not present and user is trying to login.
    if (!CommonValidators.validateNonEmptyObject(oThis.appleUserExtendedObj) && !oThis.isNewSocialConnect) {
      // If isNewSocialConnect means user is already present but apple is connected first time.
      // If isNewSocialConnect is false and appleUserExtendedObj is empty means its an error
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_c_l_ba_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: {}
        })
      );
    }

    if (CommonValidators.validateNonEmptyObject(oThis.appleUserExtendedObj)) {
      await new AppleUserExtendedModel()
        .update({
          access_token: oThis._getLCEncryptedToken(oThis.accessToken),
          refresh_token: oThis._getLCEncryptedToken(oThis.refreshToken)
        })
        .where({ id: oThis.appleUserExtendedObj.id })
        .fire();
    } else {
      let insertData = {
        apple_user_id: oThis.appleUserObj.id,
        access_token: oThis._getLCEncryptedToken(oThis.accessToken),
        refresh_token: oThis._getLCEncryptedToken(oThis.refreshToken)
      };

      // Insert user in database.
      const insertResponse = await new AppleUserExtendedModel().insert(insertData).fire();
      oThis.appleUserExtendedObj = new AppleUserExtendedModel().formatDbData(insertData);
    }

    logger.log('End::Update Apple User Extended for login');

    return responseHelper.successWithData({});
  }

  /**
   * Fetch social user extended.
   *
   * @returns {Promise<Array>}
   * @private
   */
  async _fetchSocialUserExtended() {
    const oThis = this;

    return new AppleUserExtendedModel().safeFormattedData(oThis.appleUserExtendedObj);
  }

  /**
   * Insert into twitter users.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _insertIntoSocialUsers() {
    const oThis = this;

    let insertData = {
        apple_id: oThis.appleUserEntity.id,
        user_id: oThis.userId,
        name: oThis.appleUserEntity.fullName,
        email: oThis.appleUserEntity.email
      },
      insertResponse = await new AppleUserModel().insert(insertData).fire();

    insertData.id = insertResponse.insertId;
    Object.assign(insertData, insertResponse.defaultUpdatedAttributes);

    oThis.appleUserObj = new AppleUserModel().formatDbData(insertData);
  }

  /**
   *  Get Social email of user from social entity
   *
   * @private
   */
  _getUserSocialEmail() {
    const oThis = this;

    let appleEmail = oThis.appleUserEntity.email;

    // email info is not mandatory to come from github.
    if (!oThis.appleUserEntity.email || !CommonValidators.isValidEmail(oThis.appleUserEntity.email)) {
      appleEmail = null;
    }

    return appleEmail;
  }

  /**
   * Sync additional data in apple user table.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _syncDataInSocialUsers() {
    const oThis = this;

    if (oThis.appleUserObj.email && oThis.appleUserObj.email === oThis._getUserSocialEmail()) {
      return responseHelper.successWithData({});
    }

    await new AppleUserModel()
      .update({
        email: oThis._getUserSocialEmail()
      })
      .where({
        id: oThis.appleUserObj.id
      })
      .fire();
  }

  /**
   * Get service type.
   *
   * @returns {string}
   * @private
   */
  _getServiceType() {
    return socialConnectServiceTypeConstants.appleSocialConnect;
  }

  /**
   * Get social account login property.
   *
   * @returns {String}
   * @private
   */
  _getSocialAccountLoginProperty() {
    return userConstants.hasAppleLoginProperty;
  }
}

module.exports = LoginConnectByApple;
