const rootPrefix = '../../..',
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  SignupBase = require(rootPrefix + '/lib/connect/signup/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  TwitterUserModel = require(rootPrefix + '/app/models/mysql/TwitterUser'),
  TwitterUserExtendedModel = require(rootPrefix + '/app/models/mysql/TwitterUserExtended'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob'),
  twitterUserExtendedConstants = require(rootPrefix + '/lib/globalConstant/twitterUserExtended');

/**
 * Class for signup base.
 *
 * @class SignupByTwitter
 *
 * @augments SignupBase
 */
class SignupByTwitter extends SignupBase {
  /**
   * Constructor for SignupByTwitter class.
   *
   * @param {object} params
   * @param {string} params.twitterUserObj: Twitter User Table Obj
   * @param {string} params.userTwitterEntity: User Entity Of Twitter
   * @param {string} params.token: Oauth User Token
   * @param {string} params.secret: Oauth User secret
   * @param {Object} params.twitterRespHeaders: Headers sent by twitter
   *
   * @param {string} params.inviterCodeId: invite code table id of inviter
   * @param {object} params.utmParams: utm params used while signup.
   * @param {object} params.sanitizedHeaders: sanitized headers.
   * @param {string} [params.inviteCode:] invite code.
   *
   * @constructor
   */

  constructor(params) {
    super(params);

    const oThis = this;
    oThis.token = params.token;
    oThis.secret = params.secret;
    oThis.twitterUserObj = params.twitterUserObj;
    oThis.userTwitterEntity = params.userTwitterEntity;
    oThis.twitterRespHeaders = params.twitterRespHeaders;
    oThis.tokenUserObj = null;

    oThis.twitterUserExtended = null;
  }

  /**
   * Get profile image url.
   *
   * @returns {null|*|string}
   * @private
   */
  _getProfileImageUrl() {
    const oThis = this;

    if (!oThis.userTwitterEntity.nonDefaultProfileImageUrl) {
      oThis.profileImageId = null;
      logger.log('End::Save Profile Image. Default twitter profile pic.');
      return null;
    }

    return oThis.userTwitterEntity.nonDefaultProfileImageUrl;
  }

  /**
   * Get social user name.
   *
   * @private
   */
  _getSocialUserName() {
    const oThis = this;

    return oThis.userTwitterEntity.handle;
  }

  /**
   * Get email from social account entity.
   *
   * @private
   */
  _getSocialAccountEmail() {
    const oThis = this;

    // Check if email is received from twitter
    if (oThis.userTwitterEntity.email && CommonValidators.isValidEmail(oThis.userTwitterEntity.email)) {
      return oThis.userTwitterEntity.email;
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
    return userConstants.hasTwitterLoginProperty;
  }

  /**
   * Get email from social account entity.
   *
   * @private
   */
  _getSocialAccountName() {
    const oThis = this;

    return oThis.userTwitterEntity.formattedName;
  }

  /**
   * Create or update social connect tables.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _createSocialUserRecords() {
    const oThis = this;

    await oThis._createUpdateTwitterUser();
    await oThis._createTwitterUserExtended();
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

    let encryptedSecret = localCipher.encrypt(oThis.decryptedEncryptionSalt, oThis.secret);

    let insertData = {
      twitter_user_id: oThis.twitterUserObj.id,
      user_id: oThis.userId,
      token: oThis.token,
      secret: encryptedSecret,
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

    const twitterUserExtended = new TwitterUserExtendedModel().formatDbData(insertData);
    await TwitterUserExtendedModel.flushCache(twitterUserExtended);

    logger.log('End::Create Twitter User Extended Obj');
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
      bio: oThis.userTwitterEntity.description,
      twitterUserId: oThis.twitterUserObj.id,
      twitterId: oThis.userTwitterEntity.idStr,
      userId: oThis.userId,
      profileImageId: oThis.profileImageId,
      inviterCodeId: oThis.inviterCodeId,
      isCreator: UserModel.isUserApprovedCreator(oThis.userObj),
      utmParams: oThis.utmParams
    };
    await bgJob.enqueue(bgJobConstants.afterSignUpJobTopic, messagePayload);
  }
}

module.exports = SignupByTwitter;
