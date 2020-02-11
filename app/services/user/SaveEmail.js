const rootPrefix = '../../../',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  UserEmailLogsModel = require(rootPrefix + '/app/models/mysql/big/UserEmailLogs'),
  TemporaryTokenModel = require(rootPrefix + '/app/models/mysql/big/TemporaryToken'),
  UserByEmailsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserByEmails'),
  SendTransactionalMail = require(rootPrefix + '/lib/email/hookCreator/SendTransactionalMail'),
  UserEmailLogsByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserEmailLogsByUserIds'),
  UserIdentifiersByEmailsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserIdentifiersByEmails'),
  util = require(rootPrefix + '/lib/util'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  webPageConstants = require(rootPrefix + '/lib/globalConstant/webPage'),
  temporaryTokenConstants = require(rootPrefix + '/lib/globalConstant/big/temporaryToken'),
  emailServiceApiCallHookConstants = require(rootPrefix + '/lib/globalConstant/big/emailServiceApiCallHook');

/**
 * Class to save email id of user.
 *
 * @class SaveEmail
 */
class SaveEmail extends ServiceBase {
  /**
   * Constructor to save email id of user.
   *
   * @param {object} params
   * @param {number} params.profile_user_id
   * @param {object} params.current_user
   * @param {string} params.email: email address of user
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.profileUserId = params.profile_user_id;
    oThis.currentUserId = params.current_user.id;
    oThis.email = params.email;

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

    await oThis._sendEmailDoubleOptInMail();

    return responseHelper.successWithData({});
  }

  /**
   * Validate params.
   *
   * @returns {Promise<*>}
   * @private
   */
  async _validate() {
    const oThis = this;

    if (+oThis.currentUserId !== +oThis.profileUserId) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_u_se_1',
          api_error_identifier: 'unauthorized_api_request',
          params_error_identifiers: [],
          debug_options: {}
        })
      );
    }

    // Check if the current user does not already have an email associated with it.
    const userResponse = await new UserCache({ ids: [oThis.profileUserId] }).fetch();
    if (userResponse.isFailure()) {
      return Promise.reject(userResponse);
    }

    const userDetails = userResponse.data[oThis.profileUserId];

    // If email already exists, don't let user update email.
    if (userDetails.email) {
      if (userDetails.email === oThis.email) {
        return Promise.reject(
          responseHelper.paramValidationError({
            internal_error_identifier: 'a_s_u_p_u_e_2',
            api_error_identifier: 'invalid_params',
            params_error_identifiers: ['same_account_email'],
            debug_options: {}
          })
        );
      }

      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_u_p_u_e_3',
          api_error_identifier: 'invalid_params',
          params_error_identifiers: ['email_already_added'],
          debug_options: {}
        })
      );
    }

    const promiseArray = [
      new UserByEmailsCache({ emails: [oThis.email] }).fetch(),
      new UserIdentifiersByEmailsCache({ emails: [oThis.email] }).fetch()
    ];

    const responseArray = await Promise.all(promiseArray),
      userDetailsResponse = responseArray[0],
      userIdentifiersResponse = responseArray[1];

    // Check if email is not already associated with some different user.
    if (userDetailsResponse.isFailure()) {
      return Promise.reject(userDetailsResponse);
    }

    if (userIdentifiersResponse.isFailure()) {
      return Promise.reject(userIdentifiersResponse);
    }

    const userId = userDetailsResponse.data[oThis.email].id,
      userIdentifiersUserId = userIdentifiersResponse.data[oThis.email].id;

    // If userId already exists, email is already associated with some different user.
    if (userId || userIdentifiersUserId) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_u_p_u_e_4',
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

    const userEmailLogsResponse = await new UserEmailLogsByUserIdsCache({ userIds: [oThis.profileUserId] }).fetch();
    if (userEmailLogsResponse.isFailure()) {
      return Promise.reject(userEmailLogsResponse);
    }

    const userEmailLogDetails = userEmailLogsResponse.data[oThis.profileUserId];

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
    await UserEmailLogsModel.flushCache({ userId: oThis.profileUserId });
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
        kind: temporaryTokenConstants.invertedKinds[temporaryTokenConstants.emailDoubleOptInKind]
      })
      .fire();
  }

  /**
   * Create double opt in token.
   *
   * @sets oThis.doubleOptInToken
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

    oThis.doubleOptInToken = await new TemporaryTokenModel().createDoubleOptInToken({
      entityId: oThis.userEmailLogsId,
      kind: temporaryTokenConstants.emailDoubleOptInKind,
      token: temporaryDoubleOptInToken
    });
  }

  /**
   * Send email verification double opt in mail.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _sendEmailDoubleOptInMail() {
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

module.exports = SaveEmail;
