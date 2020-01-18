const rootPrefix = '../../..',
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  SignupBase = require(rootPrefix + '/lib/connect/signup/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  AppleUserModel = require(rootPrefix + '/app/models/mysql/AppleUser'),
  AppleUserExtendedModel = require(rootPrefix + '/app/models/mysql/AppleUserExtended'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  socialConnectServiceTypeConstants = require(rootPrefix + '/lib/globalConstant/socialConnectServiceType'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob');

/**
 * Class for signup by apple.
 *
 * @class SignupByApple
 *
 * @augments SignupBase
 */
class SignupByApple extends SignupBase {
  /**
   * Constructor for SignupByApple class.
   *
   * @param {object} params
   * @param {string} params.appleOAuthDetails: Oauth User Token
   * @param {string} params.appleUserEntity: User Entity Of Github
   *
   * @constructor
   */

  constructor(params) {
    super(params);

    const oThis = this;
    oThis.appleOAuthDetails = params.appleOAuthDetails;
    oThis.appleUserEntity = params.appleUserEntity;

    oThis.appleUserObj = null;
  }

  /**
   * Get profile image url.
   *
   * @returns {null|*|string}
   * @private
   */
  _getProfileImageUrl() {
    const oThis = this;

    return null;
  }

  /**
   * Get social user name.
   *
   * @private
   */
  _getSocialUserName() {
    const oThis = this;

    //Todo: Some logic to prepare user name.
    return oThis.appleUserEntity.email;
  }

  /**
   * Get email from social account entity.
   *
   * @private
   */
  _getSocialAccountEmail() {
    const oThis = this;

    // Check if email is received from github.
    if (oThis.appleUserEntity.email && CommonValidators.isValidEmail(oThis.appleUserEntity.email)) {
      return oThis.appleUserEntity.email;
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
    return userConstants.hasAppleLoginProperty;
  }

  /**
   * Get email from social account entity.
   *
   * @private
   */
  _getSocialAccountName() {
    const oThis = this;

    return oThis.appleUserEntity.fullName;
  }

  /**
   * Create or update social connect tables.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _createSocialUserRecords() {
    const oThis = this;

    await oThis._createUpdateAppleUser();
    await oThis._createAppleUserExtended();
  }

  /**
   * Create or Update Github User Obj.
   *
   * @return {Promise<void>}
   * @private
   */
  async _createUpdateAppleUser() {
    const oThis = this;

    logger.log('Start::Create/Update Apple User Obj');

    let appleEmail = oThis.appleUserEntity.email;

    if (!oThis.appleUserEntity.email || !CommonValidators.isValidEmail(oThis.appleUserEntity.email)) {
      appleEmail = null;
    }

    let insertData = {
      apple_id: oThis.appleUserEntity.id,
      user_id: oThis.userId,
      name: oThis.appleUserEntity.fullName,
      email: appleEmail
    };
    // Insert user in database.
    const insertResponse = await new AppleUserModel().insert(insertData).fire();

    if (!insertResponse) {
      logger.error('Error while inserting data in apple users table.');

      return Promise.reject(new Error('Error while inserting data in apple users table.'));
    }

    insertData.id = insertResponse.insertId;
    Object.assign(insertData, insertResponse.defaultUpdatedAttributes);

    oThis.appleUserObj = new AppleUserModel().formatDbData(insertData);

    await AppleUserModel.flushCache(oThis.appleUserObj);

    logger.log('End::Create/Update Apple User Obj');
  }

  /**
   * Create Apple User Extended Obj.
   *
   * @return {Promise<void>}
   * @private
   */
  async _createAppleUserExtended() {
    const oThis = this;

    logger.log('Start::Create Apple User Extended Obj');

    let encryptedAccessToken = localCipher.encrypt(oThis.decryptedEncryptionSalt, oThis.appleOAuthDetails.accessToken);
    let encryptedRefreshToken = localCipher.encrypt(
      oThis.decryptedEncryptionSalt,
      oThis.appleOAuthDetails.refreshToken
    );

    let insertData = {
      apple_user_id: oThis.appleUserObj.id,
      access_token: encryptedAccessToken,
      refresh_token: encryptedRefreshToken
    };

    // Insert user in database.
    const insertResponse = await new AppleUserExtendedModel().insert(insertData).fire();

    if (!insertResponse) {
      logger.error('Error while inserting data in Apple users extended table.');
      return Promise.reject(new Error('Error while inserting data in apple users extended table.'));
    }

    insertData.id = insertResponse.insertId;
    Object.assign(insertData, insertResponse.defaultUpdatedAttributes);

    const appleUserExtended = new AppleUserExtendedModel().formatDbData(insertData);
    await AppleUserExtendedModel.flushCache(appleUserExtended);

    logger.log('End::Create Apple User Extended Obj');
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
    return socialConnectServiceTypeConstants.appleSocialConnect;
  }
}

module.exports = SignupByApple;
