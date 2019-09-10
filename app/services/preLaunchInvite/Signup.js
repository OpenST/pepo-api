const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  KmsWrapper = require(rootPrefix + '/lib/aws/KmsWrapper'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  PreLaunchInviteModel = require(rootPrefix + '/app/models/mysql/PreLaunchInvite'),
  AddContactInPepoCampaign = require(rootPrefix + '/lib/email/hookCreator/AddContact'),
  preLaunchInviteConstants = require(rootPrefix + '/lib/globalConstant/preLaunchInvite'),
  SendTransactionalMail = require(rootPrefix + '/lib/email/hookCreator/SendTransactionalMail'),
  emailServiceApiCallHookConstants = require(rootPrefix + '/lib/globalConstant/emailServiceApiCallHook'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  kmsGlobalConstant = require(rootPrefix + '/lib/globalConstant/kms'),
  basicHelper = require(rootPrefix + '/helpers/basic');

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
   * @param {string} params.userTwitterEntity: User Entity Of Twitter
   * @param {string} params.token: Oauth User Token
   * @param {string} params.secret: Oauth User secret
   * @param {string} params.inviteCode: Invite Code
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.userTwitterEntity = params.userTwitterEntity;
    oThis.token = params.token;
    oThis.secret = params.secret;
    oThis.inviteCode = params.inviteCode;

    oThis.email = oThis.userTwitterEntity.email;
    oThis.encryptedEncryptionSalt = null;
    oThis.decryptedEncryptionSalt = null;
    oThis.encryptedSecret = null;

    oThis.preLaunchInviteObj = null;
    oThis.InviterObj = null;
    oThis.inviterId = null;
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

    if (oThis.inviteCode) {
      promisesArray1.push(oThis._fetchInviterDetails());
    }

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

    if (oThis.preLaunchInviteObj.status === preLaunchInviteConstants.doptinStatus) {
      await oThis._addContactInPepoCampaign();
    }

    if (oThis.inviterId) {
      await oThis._updateInvitedUserCount();
      await oThis._sendEmail();
    }

    // await oThis._checkDuplicateEmail();

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

    oThis.encryptedSecret = localCipher.encrypt(oThis.decryptedEncryptionSalt, oThis.secret);

    logger.log('End::Generate Data Key from KMS');
    return responseHelper.successWithData({});
  }

  /**
   * Fetch inviter details
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _fetchInviterDetails() {
    const oThis = this;

    oThis.inviterObj = await new PreLaunchInviteModel().fetchByInviteCode(oThis.inviteCode);

    oThis.inviterId = oThis.inviterObj.id ? oThis.inviterObj.id : null;

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

    const status = oThis.email
      ? preLaunchInviteConstants.invertedStatuses[preLaunchInviteConstants.doptinStatus]
      : preLaunchInviteConstants.invertedStatuses[preLaunchInviteConstants.pendingStatus];

    let insertData = {
      encryption_salt: oThis.encryptedEncryptionSalt,
      twitter_id: oThis.userTwitterEntity.idStr,
      handle: oThis.userTwitterEntity.handle,
      email: oThis.email,
      name: oThis.userTwitterEntity.formattedName,
      profile_image_url: oThis.userTwitterEntity.nonDefaultProfileImageUrl,
      token: oThis.token,
      secret: oThis.encryptedSecret,
      status: status,
      admin_status: preLaunchInviteConstants.invertedAdminStatuses[preLaunchInviteConstants.whitelistPendingStatus],
      inviter_user_id: oThis.inviterId,
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
   * Add contact in pepo campaign
   *
   * @returns {Promise<void>}
   * @private
   */
  async _addContactInPepoCampaign() {
    const oThis = this;

    let addContactParams = {
      receiverEntityId: oThis.preLaunchInviteObj.id,
      receiverEntityKind: emailServiceApiCallHookConstants.preLaunchInviteEntityKind,
      customDescription: 'Contact add for pre launch invite on signup'
    };

    await new AddContactInPepoCampaign(addContactParams).perform();
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
   * Update invited user count
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateInvitedUserCount() {
    const oThis = this;

    await new PreLaunchInviteModel()
      .update('invited_user_count = invited_user_count + 1')
      .where({ id: oThis.inviterId })
      .fire();

    await PreLaunchInviteModel.flushCache({ id: oThis.inviterId });
  }

  /**
   * Send email
   *
   * @returns {Promise<void>}
   * @private
   */
  async _sendEmail() {
    const oThis = this;

    let transactionMailParams = {
      receiverEntityId: oThis.inviterId,
      receiverEntityKind: emailServiceApiCallHookConstants.preLaunchInviteEntityKind,
      customDescription: 'pre launch invite signup using invite code',
      templateName: emailServiceApiCallHookConstants.userRefferedTemplateName,
      templateVars: {
        pepo_api_domain: 1,
        twitter_handle: oThis.preLaunchInviteObj.handle
      }
    };

    await new SendTransactionalMail(transactionMailParams).perform();
  }

  /**
   *
   * @returns {Promise<void>}
   * @private
   */
  async _checkDuplicateEmail() {
    const oThis = this;

    let preLaunchInvitesForEmail = await new PreLaunchInviteModel()
      .select('count(*) as count')
      .where({ email: oThis.email })
      .fire();

    if (preLaunchInvitesForEmail[0].count > 1) {
      const errorObject = responseHelper.error({
        internal_error_identifier: 'a_s_pli_su_cde_1',
        api_error_identifier: 'something_went_wrong',
        debug_options: {
          Reason: 'Duplicate Email in pre launch invite',
          email: oThis.email,
          preLaunchInviteId: oThis.preLaunchInviteObj.id
        }
      });
      await createErrorLogsEntry.perform(errorObject, errorLogsConstants.mediumSeverity);
    }

    return Promise.resolve(responseHelper.successWithData({}));
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
