const rootPrefix = '../../..',
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  SignupBase = require(rootPrefix + '/lib/connect/signup/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  GoogleUserModel = require(rootPrefix + '/app/models/mysql/GoogleUser'),
  GoogleUserExtendedModel = require(rootPrefix + '/app/models/mysql/GoogleUserExtended'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  socialConnectServiceTypeConstants = require(rootPrefix + '/lib/globalConstant/socialConnectServiceType'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob');

/**
 * Class for signup by google.
 *
 * @class SignupByGoogle
 *
 * @augments SignupBase
 */
class SignupByGoogle extends SignupBase {
  /**
   * Constructor for SignupByGoogle class.
   *
   * @param {object} params
   * @param {string} params.accessToken: Oauth access Token
   * @param {string} params.refreshToken: Refresh Token
   * @param {string} params.userGoogleEntity: User Entity Of Google
   *
   * @constructor
   */

  constructor(params) {
    super(params);

    const oThis = this;
    oThis.accessToken = params.accessToken;
    oThis.refreshToken = params.refreshToken;
    oThis.userGoogleEntity = params.userGoogleEntity;
    oThis.googleUserObj = null;
  }

  /**
   * Get profile image url.
   *
   * @returns {null|*|string}
   * @private
   */
  _getProfileImageUrl() {
    const oThis = this;

    if (!oThis.userGoogleEntity.profileImageUrl) {
      oThis.profileImageId = null;
      logger.log('End::Save Profile Image. Default github profile pic.');
      return null;
    }

    return oThis.userGoogleEntity.profileImageUrl;
  }

  /**
   * Get social user name.
   *
   * @private
   */
  _getSocialUserName() {
    const oThis = this;

    return oThis.userGoogleEntity.userName;
  }

  /**
   * Get email from social account entity.
   *
   * @private
   */
  _getSocialAccountEmail() {
    const oThis = this;

    // Check if email is received from github.
    if (oThis.userGoogleEntity.email && CommonValidators.isValidEmail(oThis.userGoogleEntity.email)) {
      return oThis.userGoogleEntity.email;
    }

    return null;
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

  /**
   * Get email from social account entity.
   *
   * @private
   */
  _getSocialAccountName() {
    const oThis = this;

    return oThis.userGoogleEntity.formattedName;
  }

  /**
   * Create or update social connect tables.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _createSocialUserRecords() {
    const oThis = this;

    await oThis._createUpdateGoogleUser();
    await oThis._createUpdateGoogleUserExtended();
  }

  /**
   * Create or Update Google User Obj.
   *
   * @return {Promise<void>}
   * @private
   */
  async _createUpdateGoogleUser() {
    const oThis = this;

    logger.log('Start::Create/Update Google User Obj');

    let insertData = {
      google_id: oThis.userGoogleEntity.id,
      user_id: oThis.userId,
      name: oThis.userGoogleEntity.formattedName,
      email: oThis._getSocialAccountEmail(),
      profile_image_url: oThis.userGoogleEntity.profileImageShortUrl
    };
    // Insert user in database.
    const insertResponse = await new GoogleUserModel().insert(insertData).fire();

    if (!insertResponse) {
      logger.error('Error while inserting data in google users table.');

      return Promise.reject(new Error('Error while inserting data in google users table.'));
    }

    insertData.id = insertResponse.insertId;
    Object.assign(insertData, insertResponse.defaultUpdatedAttributes);

    oThis.googleUserObj = new GoogleUserModel().formatDbData(insertData);

    logger.log('End::Create/Update Google User Obj');
  }

  /**
   * Create Google User Extended Obj.
   *
   * @return {Promise<void>}
   * @private
   */
  async _createUpdateGoogleUserExtended() {
    const oThis = this;

    logger.log('Start::Create Google User Extended Obj');

    let encryptedAccessToken = localCipher.encrypt(oThis.decryptedEncryptionSalt, oThis.accessToken);
    let encryptedRefreshToken = null;

    if (oThis.refreshToken) {
      encryptedRefreshToken = localCipher.encrypt(oThis.decryptedEncryptionSalt, oThis.refreshToken);
    }

    let insertData = {
      google_user_id: oThis.googleUserObj.id,
      access_token: encryptedAccessToken,
      refresh_token: encryptedRefreshToken
    };

    // Insert user in database.
    const insertResponse = await new GoogleUserExtendedModel().insert(insertData).fire();

    if (!insertResponse) {
      logger.error('Error while inserting data in GoogleUserExtended table.');
      return Promise.reject(new Error('Error while inserting data in GoogleUserExtended table.'));
    }

    insertData.id = insertResponse.insertId;
    Object.assign(insertData, insertResponse.defaultUpdatedAttributes);

    logger.log('End::Create Google User Extended Obj');
  }

  /**
   * Enqueue after sign-up job.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _enqueueAfterSignupJob() {
    const oThis = this;

    const messagePayload = {
      userId: oThis.userId,
      profileImageId: oThis.profileImageId,
      inviterCodeId: oThis.inviterCodeId,
      isCreator: UserModel.isUserApprovedCreator(oThis.userObj),
      utmParams: oThis.utmParams
    };
    await bgJob.enqueue(bgJobConstants.afterSignUpJobTopic, messagePayload);
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
}

module.exports = SignupByGoogle;
