const rootPrefix = '../../..',
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  SignupBase = require(rootPrefix + '/lib/connect/signup/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  GithubUserModel = require(rootPrefix + '/app/models/mysql/GithubUser'),
  GithubUserExtendedModel = require(rootPrefix + '/app/models/mysql/GithubUserExtended'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  socialConnectServiceTypeConstants = require(rootPrefix + '/lib/globalConstant/socialConnectServiceType'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob');

/**
 * Class for signup by github.
 *
 * @class SignupByGithub
 *
 * @augments SignupBase
 */
class SignupByGithub extends SignupBase {
  /**
   * Constructor for SignupByGithub class.
   *
   * @param {object} params
   * @param {string} params.accessToken: Oauth User Token
   * @param {string} params.userGithubEntity: User Entity Of Github
   *
   * @constructor
   */

  constructor(params) {
    super(params);

    const oThis = this;
    oThis.accessToken = params.accessToken;
    oThis.userGithubEntity = params.userGithubEntity;
    oThis.githubUserObj = null;
  }

  /**
   * Get profile image url.
   *
   * @returns {null|*|string}
   * @private
   */
  _getProfileImageUrl() {
    const oThis = this;

    if (!oThis.userGithubEntity.profileImageUrl) {
      oThis.profileImageId = null;
      logger.log('End::Save Profile Image. Default github profile pic.');
      return null;
    }

    return oThis.userGithubEntity.profileImageUrl;
  }

  /**
   * Get social user name.
   *
   * @private
   */
  _getSocialUserName() {
    const oThis = this;

    return oThis.userGithubEntity.userName;
  }

  /**
   * Get email from social account entity.
   *
   * @private
   */
  _getSocialAccountEmail() {
    const oThis = this;

    // Check if email is received from github.
    if (oThis.userGithubEntity.email && CommonValidators.isValidEmail(oThis.userGithubEntity.email)) {
      return oThis.userGithubEntity.email;
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
    return userConstants.hasGithubLoginProperty;
  }

  /**
   * Get email from social account entity.
   *
   * @private
   */
  _getSocialAccountName() {
    const oThis = this;

    return oThis.userGithubEntity.formattedName;
  }

  /**
   * Create or update social connect tables.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _createSocialUserRecords() {
    const oThis = this;

    await oThis._createUpdateGithubUser();
    await oThis._createGithubUserExtended();
  }

  /**
   * Create or Update Github User Obj.
   *
   * @return {Promise<void>}
   * @private
   */
  async _createUpdateGithubUser() {
    const oThis = this;

    logger.log('Start::Create/Update Github User Obj');

    let userName = oThis.userGithubEntity.userName;

    let insertData = {
      github_id: oThis.userGithubEntity.id,
      user_id: oThis.userId,
      user_name: userName,
      name: oThis._getSocialAccountName(),
      email: oThis._getSocialAccountEmail(),
      profile_image_url: oThis.userGithubEntity.profileImageShortUrl
    };
    // Insert user in database.
    const insertResponse = await new GithubUserModel().insert(insertData).fire();

    if (!insertResponse) {
      logger.error('Error while inserting data in github users table.');

      return Promise.reject(new Error('Error while inserting data in github users table.'));
    }

    insertData.id = insertResponse.insertId;
    Object.assign(insertData, insertResponse.defaultUpdatedAttributes);

    oThis.githubUserObj = new GithubUserModel().formatDbData(insertData);

    logger.log('End::Create/Update Github User Obj');
  }

  /**
   * Create Github User Extended Obj.
   *
   * @return {Promise<void>}
   * @private
   */
  async _createGithubUserExtended() {
    const oThis = this;

    logger.log('Start::Create Github User Extended Obj');

    let encryptedAccessToken = localCipher.encrypt(oThis.decryptedEncryptionSalt, oThis.accessToken);

    let insertData = {
      github_user_id: oThis.githubUserObj.id,
      access_token: encryptedAccessToken
    };

    // Insert user in database.
    const insertResponse = await new GithubUserExtendedModel().insert(insertData).fire();

    if (!insertResponse) {
      logger.error('Error while inserting data in Github users extended table.');
      return Promise.reject(new Error('Error while inserting data in github users extended table.'));
    }

    insertData.id = insertResponse.insertId;
    Object.assign(insertData, insertResponse.defaultUpdatedAttributes);

    const githubUserExtended = new GithubUserExtendedModel().formatDbData(insertData);
    await GithubUserExtendedModel.flushCache(githubUserExtended);

    logger.log('End::Create Github User Extended Obj');
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
      bio: oThis.userGithubEntity.bio,
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
    return socialConnectServiceTypeConstants.githubSocialConnect;
  }
}

module.exports = SignupByGithub;
