const rootPrefix = '../../..',
  LoginConnectBase = require(rootPrefix + '/lib/connect/login/Base'),
  GoogleUserModel = require(rootPrefix + '/app/models/mysql/GoogleUser'),
  GoogleUserExtendedModel = require(rootPrefix + '/app/models/mysql/GoogleUserExtended'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  socialConnectServiceTypeConstants = require(rootPrefix + '/lib/globalConstant/socialConnectServiceType'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

/**
 * Class for Google Login service.
 *
 * @class LoginConnectByGoogle
 */
class LoginConnectByGoogle extends LoginConnectBase {
  /**
   * Constructor for Github Login service.
   *
   * @param {object} params
   * @param {string} params.accessToken: Oauth access Token
   * @param {string} params.refreshToken: Refresh Token
   * @param {object} params.userGoogleEntity: User Entity Of Google
   * @param {string} params.userId: user id
   * @param {object} params.googleUserObj: Google user obj if present
   *
   * @augments LoginConnectBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.googleUserObj = params.googleUserObj;
    oThis.accessToken = params.accessToken;
    oThis.refreshToken = params.refreshToken;
    oThis.userGoogleEntity = params.userGoogleEntity;
    oThis.userId = params.userId;

    oThis.googleUserExtendedObj = null;
  }

  /**
   * Update Google User Extended object.
   *
   * @sets oThis.googleUserExtendedObj
   *
   * @returns {Promise<void>}
   * @private
   */
  async _createUpdateSocialUserExtended() {
    const oThis = this;

    logger.log('Start::Update Google User Extended for login', oThis.googleUserObj);

    oThis.googleUserExtendedObj = await new GoogleUserExtendedModel().fetchByGoogleUserId(oThis.googleUserObj.id);

    // If googleUserExtendedObj is not present and user is trying to login.
    if (!CommonValidators.validateNonEmptyObject(oThis.googleUserExtendedObj) && !oThis.isNewSocialConnect) {
      // If isNewSocialConnect means user is already present but google is connected first time.
      // If isNewSocialConnect is false and googleUserExtendedObj is empty means its an error
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_c_l_bgo_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: {}
        })
      );
    }

    if (CommonValidators.validateNonEmptyObject(oThis.googleUserExtendedObj)) {
      await oThis._updateGoogleUserExtended();
    } else {
      await oThis._insertGoogleUserExtended();
    }

    logger.log('End::Update Google User Extended for login');

    return responseHelper.successWithData({});
  }

  /**
   * Insert Google user extended
   *
   * @returns {Promise<void>}
   * @private
   */
  async _insertGoogleUserExtended() {
    const oThis = this;

    let insertData = {
      google_user_id: oThis.googleUserObj.id,
      access_token: oThis._getLCEncryptedToken(oThis.accessToken),
      refresh_token: oThis._getLCEncryptedToken(oThis.refreshToken)
    };

    // Insert user in database.
    const insertResponse = await new GoogleUserExtendedModel().insert(insertData).fire();
    oThis.googleUserExtendedObj = new GoogleUserExtendedModel().formatDbData(insertData);
  }

  /**
   * Update Google user extended
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateGoogleUserExtended() {
    const oThis = this;

    await new GoogleUserExtendedModel()
      .update({
        access_token: oThis._getLCEncryptedToken(oThis.accessToken),
        refresh_token: oThis._getLCEncryptedToken(oThis.refreshToken)
      })
      .where({ id: oThis.googleUserExtendedObj.id })
      .fire();
  }

  /**
   * Fetch social user extended.
   *
   * @returns {Promise<Array>}
   * @private
   */
  async _fetchSocialUserExtended() {
    const oThis = this;

    return new GoogleUserExtendedModel().safeFormattedData(oThis.googleUserExtendedObj);
  }

  /**
   * Insert into google users.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _insertIntoSocialUsers() {
    const oThis = this;

    let insertData = {
        google_id: oThis.userGoogleEntity.id,
        user_id: oThis.userId,
        name: oThis.userGoogleEntity.formattedName,
        email: oThis._getUserSocialEmail(),
        profile_image_url: oThis.userGoogleEntity.profileImageShortUrl
      },
      insertResponse = await new GoogleUserModel().insert(insertData).fire();

    insertData.id = insertResponse.insertId;
    Object.assign(insertData, insertResponse.defaultUpdatedAttributes);

    oThis.googleUserObj = new GoogleUserModel().formatDbData(insertData);
  }

  /**
   *  Get Social email of user from social entity
   *
   * @private
   */
  _getUserSocialEmail() {
    const oThis = this;

    let googleEmail = oThis.userGoogleEntity.email;

    // email info is not mandatory to come from github.
    if (!oThis.userGoogleEntity.email || !CommonValidators.isValidEmail(oThis.userGoogleEntity.email)) {
      googleEmail = null;
    }

    return googleEmail;
  }

  /**
   * Sync additional data in github user table.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _syncDataInSocialUsers() {
    const oThis = this;

    if (oThis.googleUserObj.email && oThis.googleUserObj.email === oThis._getUserSocialEmail()) {
      return responseHelper.successWithData({});
    }

    await new GoogleUserModel()
      .update({
        email: oThis._getUserSocialEmail()
      })
      .where({
        id: oThis.googleUserObj.id
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
    return socialConnectServiceTypeConstants.googleSocialConnect;
  }

  /**
   * Get social account login property.
   *
   * @returns {String}
   * @private
   */
  _getSocialAccountLoginProperty() {
    return userConstants.hasGoogleLoginProperty;
  }
}

module.exports = LoginConnectByGoogle;
