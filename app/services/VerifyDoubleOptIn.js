const rootPrefix = '../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserIdentifierModel = require(rootPrefix + '/app/models/mysql/UserIdentifier'),
  UserEmailLogsModel = require(rootPrefix + '/app/models/mysql/big/UserEmailLogs'),
  TemporaryTokenModel = require(rootPrefix + '/app/models/mysql/big/TemporaryToken'),
  UserByEmailsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserByEmails'),
  AddContactInPepoCampaign = require(rootPrefix + '/lib/email/hookCreator/AddContact'),
  UserIdentifiersByEmailsCache = require(rootPrefix + '/lib/cacheManagement/multi/UserIdentifiersByEmails'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  localCipher = require(rootPrefix + '/lib/encryptors/localCipher'),
  temporaryTokenConstants = require(rootPrefix + '/lib/globalConstant/big/temporaryToken'),
  emailServiceApiCallHookConstants = require(rootPrefix + '/lib/globalConstant/big/emailServiceApiCallHook');

/**
 * Class to verify double opt in token.
 *
 * @class VerifyDoubleOptIn
 */
class VerifyDoubleOptIn extends ServiceBase {
  /**
   * Constructor to verify double opt in token.
   *
   * @param {object} params
   * @param {string} params.t
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.inputToken = params.t;

    oThis.token = null;
    oThis.temporaryTokenId = null;
    oThis.temporaryTokenObj = null;
    oThis.tokenCreationTimestamp = null;
  }

  /**
   * Async perform.
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._validate();

    await oThis._fetchDoubleOptInToken();

    await oThis._performKindSpecificOperations();

    return responseHelper.successWithData({});
  }

  /**
   * Validate token.
   *
   * @sets oThis.token, oThis.temporaryTokenId
   *
   * @returns {Promise<never>}
   * @private
   */
  async _validate() {
    const oThis = this;

    let splitToken = [];

    try {
      const decryptedT = localCipher.decrypt(coreConstants.PA_EMAIL_TOKENS_DECRIPTOR_KEY, oThis.inputToken);
      splitToken = decryptedT.split(':');
    } catch (error) {
      return oThis._invalidUrlError('a_s_do_v_1');
    }

    if (splitToken.length !== 2) {
      return oThis._invalidUrlError('a_s_do_v_2');
    }

    oThis.temporaryTokenId = parseInt(splitToken[0]);
    oThis.token = splitToken[1];
  }

  /**
   * Fetch double opt in token.
   *
   * @sets oThis.temporaryTokenObj
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchDoubleOptInToken() {
    const oThis = this;

    oThis.temporaryTokenObj = await new TemporaryTokenModel().fetchById(oThis.temporaryTokenId);

    if (!oThis.temporaryTokenObj.token) {
      return oThis._invalidUrlError('a_s_do_fpiot_1');
    }

    if (oThis.temporaryTokenObj.token !== oThis.token) {
      return oThis._invalidUrlError('a_s_do_fpiot_2');
    }

    if (oThis.temporaryTokenObj.status !== temporaryTokenConstants.activeStatus) {
      return oThis._invalidUrlError('a_s_do_fpiot_3');
    }

    if (
      Math.floor(Date.now() / 1000) - temporaryTokenConstants.tokenExpiryTimestamp >
      oThis.temporaryTokenObj.createdAt
    ) {
      return oThis._invalidUrlError('a_s_do_fpiot_4');
    }
  }

  /**
   * Perform operations specific to temporary token kind.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _performKindSpecificOperations() {
    const oThis = this;

    const promisesArray = [];

    switch (oThis.temporaryTokenObj.kind) {
      case temporaryTokenConstants.emailDoubleOptInKind: {
        promisesArray.push(oThis._addEmailForUser());
        promisesArray.push(
          oThis._addContactInPepoCampaign(emailServiceApiCallHookConstants.emailDoubleOptInEntityKind)
        );
        break;
      }
      default: {
        throw new Error('Invalid token kind.');
      }
    }

    promisesArray.push(oThis._markTokenAsUsed());
    await Promise.all(promisesArray);
  }

  /**
   * Add contact in pepo campaign.
   *
   * @param {string} receiverEntityKind
   *
   * @returns {Promise<void>}
   * @private
   */
  async _addContactInPepoCampaign(receiverEntityKind) {
    const oThis = this;

    const addContactParams = {
      receiverEntityId: oThis.temporaryTokenObj.entityId,
      receiverEntityKind: receiverEntityKind
    };

    switch (receiverEntityKind) {
      case emailServiceApiCallHookConstants.emailDoubleOptInEntityKind: {
        addContactParams.customDescription = 'Contact add for email double opt in.';
        addContactParams.customAttributes = { [emailServiceApiCallHookConstants.appSignupAttribute]: 1 };
        break;
      }
      default: {
        throw new Error('Invalid kind.');
      }
    }

    await new AddContactInPepoCampaign(addContactParams).perform();
  }

  /**
   * Associate email for user.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _addEmailForUser() {
    const oThis = this;

    // Fetch details from user email logs table.
    const userEmailLogsDetails = await new UserEmailLogsModel()
      .select('user_id, email')
      .where({ id: oThis.temporaryTokenObj.entityId })
      .fire();

    if (userEmailLogsDetails.length !== 1) {
      return oThis._invalidUrlError('a_s_do_aefu_1');
    }

    const userId = userEmailLogsDetails[0].user_id,
      email = userEmailLogsDetails[0].email,
      promiseArray = [];

    await oThis._checkIfEmailExist(email);

    promiseArray.push(oThis._updateEmailInUsers(email, userId));
    promiseArray.push(oThis._insertUserIdentifiers(email, userId));

    await Promise.all(promiseArray);
  }

  /**
   * Update email in users table.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateEmailInUsers(email, userId) {
    const UserModel = require(rootPrefix + '/app/models/mysql/User');

    // Update email for user.
    await new UserModel()
      .update({ email: email })
      .where({ id: userId })
      .fire()
      .then(async function() {
        await UserModel.flushCache({ id: userId, email: email });
      })
      .catch(function(err) {
        logger.error(`Error while creating updating email in users table: ${err}`);

        if (UserModel.isDuplicateIndexViolation(UserModel.emailUniqueIndexName, err)) {
          logger.log('Email conflict.');

          return Promise.reject(
            responseHelper.paramValidationError({
              internal_error_identifier: 'a_s_vdoi_1',
              api_error_identifier: 'invalid_params',
              params_error_identifiers: ['already_associated_email'],
              debug_options: {}
            })
          );
        }

        return Promise.reject(err);
      });
  }

  /**
   * Insert into user identifiers.
   *
   * @param email
   * @param userId
   * @returns {Promise<void>}
   * @private
   */
  async _insertUserIdentifiers(email, userId) {
    await new UserIdentifierModel()
      .insertUserEmail(userId, email)
      .then(async function() {
        await UserIdentifierModel.flushCache({ emails: [email] });
      })
      .catch(function(err) {
        logger.error(`Error while inserting email in user identifiers table. : ${err}`);

        if (UserIdentifierModel.isDuplicateIndexViolation(UserIdentifierModel.eValueUniqueIndexName, err)) {
          logger.log('Email conflict.');

          return Promise.reject(
            responseHelper.paramValidationError({
              internal_error_identifier: 'a_s_vdoi_2',
              api_error_identifier: 'invalid_params',
              params_error_identifiers: ['already_associated_email'],
              debug_options: {}
            })
          );
        }

        return Promise.reject(err);
      });
  }

  /**
   * Checks if email exist in the system.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _checkIfEmailExist(email) {
    const promiseArray = [
      new UserByEmailsCache({ emails: [email] }).fetch(),
      new UserIdentifiersByEmailsCache({ emails: [email] }).fetch()
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

    const userId = userDetailsResponse.data[email].id,
      userIdFromUserIdentifiersTable = userIdentifiersResponse.data[email].id;

    // If userId already exists, email is already associated with some different user.
    if (userId || userIdFromUserIdentifiersTable) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_vdoi_2',
          api_error_identifier: 'invalid_params',
          params_error_identifiers: ['already_associated_email'],
          debug_options: {}
        })
      );
    }
  }

  /**
   * Mark token as used.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _markTokenAsUsed() {
    const oThis = this;

    await new TemporaryTokenModel()
      .update({ status: temporaryTokenConstants.invertedStatuses[temporaryTokenConstants.usedStatus] })
      .where({ id: oThis.temporaryTokenId })
      .fire();
  }

  /**
   * Invalid url error.
   *
   * @param {string} code
   *
   * @returns {Promise<never>}
   * @private
   */
  async _invalidUrlError(code) {
    return Promise.reject(
      responseHelper.error({
        internal_error_identifier: code,
        api_error_identifier: 'invalid_api_params',
        debug_options: {}
      })
    );
  }
}

module.exports = VerifyDoubleOptIn;
