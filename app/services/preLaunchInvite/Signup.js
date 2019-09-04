const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  KmsWrapper = require(rootPrefix + '/lib/aws/KmsWrapper'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  PreLaunchInviteModel = require(rootPrefix + '/app/models/mysql/PreLaunchInvite'),
  preLaunchInviteConstants = require(rootPrefix + '/lib/globalConstant/preLaunchInvite'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  kmsGlobalConstant = require(rootPrefix + '/lib/globalConstant/kms'),
  SendDoubleOptInService = require(rootPrefix + '/app/services/SendDoubleOptIn'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common');

/**
 * Class for pre launch invite Signup service.
 *
 * @class PreLaunchTwitterSignUp
 */
class PreLaunchTwitterSignUp extends ServiceBase {
  /**
   * Constructor for pre launch invite signup service.
   *
   * @param {object} params
   * @param {string} params.twitterUserObj: Twitter User Table Obj
   * @param {string} params.userTwitterEntity: User Entity Of Twitter
   * @param {string} params.token: Oauth User Token
   * @param {string} params.secret: Oauth User secret
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.twitterUserObj = params.twitterUserObj;
    oThis.userTwitterEntity = params.userTwitterEntity;
    oThis.token = params.token;
    oThis.secret = params.secret;

    oThis.encryptedEncryptionSalt = null;
    oThis.decryptedEncryptionSalt = null;
    oThis.encryptedCookieToken = null;
    oThis.encryptedSecret = null;

    oThis.preLaunchInviteObj = null;
  }

  /**
   * Perform: Perform user creation.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._performSignup();

    return Promise.resolve(oThis._serviceResponse());
  }

  /**
   *  Perform For Signup Via Twitter.
   *
   * @return {Promise<void>}
   * @private
   */
  async _performSignup() {
    const oThis = this;
    logger.log('Start::Perform Twitter Signup');

    const promisesArray1 = [];

    // starting the create user in ost in parallel.

    promisesArray1.push(oThis._setKMSEncryptionSalt());

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

    await oThis._createPreLaunchInvite();

    // if email is present then enqueue for doptin creator
    if (oThis.userTwitterEntity.email || CommonValidators.isValidEmail(oThis.userTwitterEntity.email)) {
      oThis._sendDoubleOptIn();
    }

    logger.log('End::Perform Twitter Signup');

    return responseHelper.successWithData({});
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

    let cookieToken = localCipher.generateRandomIv(32);

    oThis.encryptedCookieToken = localCipher.encrypt(oThis.decryptedEncryptionSalt, cookieToken);
    oThis.encryptedSecret = localCipher.encrypt(oThis.decryptedEncryptionSalt, oThis.secret);

    logger.log('End::Generate Data Key from KMS');
    return responseHelper.successWithData({});
  }

  /**
   * Create pre launch invite
   *
   * @return {Promise<void>}
   * @private
   */
  async _createPreLaunchInvite() {
    const oThis = this;

    logger.log('Start::Creating pre launch invite');

    let insertData = {
      encryption_salt: oThis.encryptedEncryptionSalt,
      twitter_id: oThis.userTwitterEntity.idStr,
      handle: oThis.userTwitterEntity.handle,
      email: oThis.userTwitterEntity.email,
      name: oThis.userTwitterEntity.formattedName,
      profile_image_url: oThis.userTwitterEntity.nonDefaultProfileImageUrl,
      token: oThis.token,
      secret: oThis.encryptedSecret,
      status: preLaunchInviteConstants.invertedStatuses[preLaunchInviteConstants.pendingStatus],
      invite_code: oThis._createInviteCode(),
      invited_user_count: 0
    };

    let insertResponse = await new PreLaunchInviteModel().insert(insertData).fire();

    if (!insertResponse) {
      logger.error('Error while inserting data in pre_launch_invites table.');
      return Promise.reject(new Error('Error while inserting data in pre_launch_invites table.'));
    }

    insertData.id = insertResponse.insertId;
    Object.assign(insertData, insertResponse.defaultUpdatedAttributes);

    oThis.preLaunchInviteObj = new PreLaunchInviteModel().formatDbData(insertData);
    await PreLaunchInviteModel.flushCache(oThis.preLaunchInviteObj);

    logger.log('End::Creating pre launch invite');
    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Create invite code
   *
   * @returns {string}
   * @private
   */
  _createInviteCode() {
    const oThis = this;

    logger.log('Start::Creating invite code');

    let inviteStringLength = preLaunchInviteConstants.defaultInviteCodeLength,
      inviteString = basicHelper.getRandomAlphaNumericString().substring(0, inviteStringLength);

    return inviteString.toUpperCase();
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
      profileImageId: oThis.profileImageId
    };
    await bgJob.enqueue(bgJobConstants.afterSignUpJobTopic, messagePayload);
  }

  /**
   * Send double opt in
   *
   * @returns {Promise<*>}
   * @private
   */
  async _sendDoubleOptIn() {
    const oThis = this;

    let sendDoubleOptInParams = {
      pre_launch_invite_hook: oThis.preLaunchInviteObj
    };

    return await new SendDoubleOptInService(sendDoubleOptInParams).perform();
  }

  /**
   * Service response.
   *
   * @return {Promise<void>}
   * @private
   */
  async _serviceResponse() {
    const oThis = this;

    logger.log('Start::Service Response for PreLaunchInvite twitter SignUp');

    const preLaunchInviteLoginCookieValue = new PreLaunchInviteModel().getCookieValueFor(
      oThis.preLaunchInviteObj,
      oThis.decryptedEncryptionSalt,
      {
        timestamp: Date.now() / 1000
      }
    );

    logger.log('End::Service Response for PreLaunchInvite twitter SignUp');

    const safeFormattedPreLaunchInviteData = new PreLaunchInviteModel().safeFormattedData(oThis.preLaunchInviteObj);

    return responseHelper.successWithData({
      preLaunchInvite: safeFormattedPreLaunchInviteData,
      preLaunchInviteLoginCookieValue: preLaunchInviteLoginCookieValue
    });
  }
}

module.exports = PreLaunchTwitterSignUp;
