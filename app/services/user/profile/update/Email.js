const rootPrefix = '../../../../..',
  UserEmailLogsModel = require(rootPrefix + '/app/models/mysql/UserEmailLogs'),
  TemporaryTokenModel = require(rootPrefix + '/app/models/mysql/TemporaryToken'),
  UpdateProfileBase = require(rootPrefix + '/app/services/user/profile/update/Base'),
  UserByEmailsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserByEmails'),
  SendTransactionalMail = require(rootPrefix + '/lib/email/hookCreator/SendTransactionalMail'),
  util = require(rootPrefix + '/lib/util'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  webPageConstants = require(rootPrefix + '/lib/globalConstant/webPage'),
  temporaryTokenConstants = require(rootPrefix + '/lib/globalConstant/temporaryToken'),
  emailServiceApiCallHookConstants = require(rootPrefix + '/lib/globalConstant/emailServiceApiCallHook');

/**
 * Class to update email id of user.
 *
 * @class UpdateEmail
 */
class UpdateEmail extends UpdateProfileBase {
  /**
   * Constructor to update email id of user.
   *
   * @param {object} params
   * @param {number} params.profile_user_id
   * @param {object} params.current_user
   * @param {string} params.email: email address of user
   *
   * @augments UpdateProfileBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.email = oThis.params.email;

    oThis.temporaryTokenId = null;
    oThis.userEmailLogsId = null;
    oThis.doubleOptInToken = null;
  }

  /**
   * Async perform.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validate();

    await oThis._createUserEmailLogs();

    await oThis._createDoubleOptInToken();

    await oThis._sendPreLaunchInviteDoubleOptInMail();

    return responseHelper.successWithData({});
  }

  /**
   * Validate params.
   *
   * @returns {Promise<*>}
   * @private
   */
  async _validateParams() {
    const oThis = this;

    // Check if email is not already associated with some different user.
    const userDetailsResponse = await new UserByEmailsCache({ email: [oThis.email] }).fetch();
    if (userDetailsResponse.isFailure()) {
      return Promise.reject(userDetailsResponse);
    }

    const userId = userDetailsResponse.data[oThis.email].id;

    // If userId already exists, email is already associated with some different user.
    if (userId) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_u_p_u_e_1',
          api_error_identifier: 'invalid_params',
          params_error_identifiers: ['already_associated_email'],
          debug_options: {}
        })
      );
    }
  }

  /**
   * Create entry in user email logs model.
   *
   * @sets oThis.userEmailLogsId
   *
   * @returns {Promise<void>}
   * @private
   */
  async _createUserEmailLogs() {
    const oThis = this;

    const userEmailLogDetails = await new UserEmailLogsModel().fetchByUserId(oThis.profileUserId);

    if (userEmailLogDetails.email && userEmailLogDetails.id) {
      const promisesArray = [];

      oThis.userEmailLogsId = userEmailLogDetails.id;
      const previousEmail = userEmailLogDetails.email;

      // Invalidate previous tokens for same user.
      promisesArray.push(oThis._invalidatePreviousTokens());

      if (previousEmail !== oThis.email) {
        // Update email for already existing user.
        promisesArray.push(
          new UserEmailLogsModel()
            .update({ email: oThis.email })
            .where({ user_id: oThis.profileUserId })
            .fire()
        );
      }

      await Promise.all(promisesArray);
    } else {
      // If entry for user does not exist, create one.
      const insertResponse = await new UserEmailLogsModel()
        .insert({
          email: oThis.email,
          user_id: oThis.profileUserId
        })
        .fire();

      oThis.userEmailLogsId = insertResponse.insertId;
    }
  }

  /**
   * Mark previous tokens as inactive.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _invalidatePreviousTokens() {
    const oThis = this;

    await new TemporaryTokenModel()
      .update({
        status: temporaryTokenConstants.invertedStatuses[temporaryTokenConstants.inActiveStatus]
      })
      .where({
        entity_id: oThis.userEmailLogsId,
        entity_kind: temporaryTokenConstants.invertedKinds[temporaryTokenConstants.emailDoubleOptInKind]
      })
      .fire();
  }

  /**
   * Create double opt in token.
   *
   * @sets oThis.temporaryTokenId, oThis.doubleOptInToken
   *
   * @returns {Promise<never>}
   * @private
   */
  async _createDoubleOptInToken() {
    const oThis = this;

    const tokenString = `${oThis.userEmailLogsId.id}::${
      oThis.email
    }::${Date.now()}::emailDoubleOptIn::${Math.random()}`;

    const temporaryDoubleOptInToken = util.createMd5Digest(tokenString);

    const insertResponse = await new TemporaryTokenModel()
      .insert({
        entity_id: oThis.userEmailLogsId,
        kind: temporaryTokenConstants.invertedKinds[temporaryTokenConstants.emailDoubleOptInKind],
        token: temporaryDoubleOptInToken,
        status: temporaryTokenConstants.invertedStatuses[temporaryTokenConstants.activeStatus]
      })
      .fire();

    if (!insertResponse) {
      return Promise.reject(new Error('Error while inserting data into temporary_tokens table.'));
    }

    oThis.temporaryTokenId = insertResponse.insertId;

    const doubleOptInTokenStr = `${oThis.temporaryTokenId.toString()}:${temporaryDoubleOptInToken}`;

    oThis.doubleOptInToken = localCipher.encrypt(coreConstants.PA_EMAIL_TOKENS_DECRIPTOR_KEY, doubleOptInTokenStr);
  }

  /**
   * Send email verification double opt in mail.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _sendPreLaunchInviteDoubleOptInMail() {
    const oThis = this;

    const link = encodeURIComponent(`${webPageConstants.optInEmailLink}?t=${oThis.doubleOptInToken}`);

    const transactionalMailParams = {
      receiverEntityId: oThis.userEmailLogsId,
      receiverEntityKind: emailServiceApiCallHookConstants.emailDoubleOptInEntityKind,
      templateName: emailServiceApiCallHookConstants.pepoDoubleOptInTemplateName,
      templateVars: {
        pepo_api_domain: 1,
        opt_in_email_link: link
      }
    };

    await new SendTransactionalMail(transactionalMailParams).perform();
  }
}

module.exports = UpdateEmail;
