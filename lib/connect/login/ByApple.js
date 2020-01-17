const rootPrefix = '../../..',
  LoginConnectBase = require(rootPrefix + '/lib/connect/login/Base'),
  AppleUserModel = require(rootPrefix + '/app/models/mysql/AppleUser'),
  AppleUserExtendedModel = require(rootPrefix + '/app/models/mysql/AppleUserExtended'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
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
   * @param {string} params.email: email address
   * @param {string} params.fullName: Full name from apple
   * @param {string} params.userGithubEntity: User Entity Of Github
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
    oThis.accessToken = params.accessToken;
    oThis.refreshToken = params.refreshToken;

    oThis.userId = oThis.appleUserObj.userId;

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
  async _updateSocialUserExtended() {
    const oThis = this;

    logger.log('Start::Update Apple User Extended for login', oThis.appleUserObj);

    // TODO - dhananjay - use cache instead
    oThis.appleUserExtendedObj = await new AppleUserExtendedModel().fetchByAppleUserId(oThis.appleUserObj.id);

    await new AppleUserExtendedModel()
      .update({
        access_token: oThis._getLCEncryptedToken(oThis.accessToken),
        refresh_token: oThis._getLCEncryptedToken(oThis.refreshToken)
      })
      .where({ id: oThis.appleUserObj.id })
      .fire();

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

    await new AppleUserModel()
      .insert({
        apple_id: oThis.appleUserObj.appleId,
        user_id: oThis.userId,
        name: oThis.appleUserObj.name,
        email: oThis.appleUserObj.email
      })
      .fire();
  }

  /**
   *  Get Social email of user from social entity
   *
   * @private
   */
  _getUserSocialEmail() {
    const oThis = this;

    return oThis.appleUserObj.email;
  }

  /**
   * Update twitter users.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateSocialUsers() {
    const oThis = this;

    await new AppleUserModel()
      .update({
        user_id: oThis.userId,
        name: oThis.appleUserObj.name
      })
      .where({
        id: oThis.appleUserObj.id
      })
      .fire();
  }

  /**
   * Sync additional data in apple user table.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _syncDataInSocialUsers() {
    const oThis = this;

    return true;
  }
}

module.exports = LoginConnectByApple;
