const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UsersCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  SendTransactionalMail = require(rootPrefix + '/lib/email/hookCreator/SendTransactionalMail'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  emailConstants = require(rootPrefix + '/lib/globalConstant/email'),
  ActivityLogModel = require(rootPrefix + '/app/models/mysql/AdminActivityLog'),
  adminActivityLogConstants = require(rootPrefix + '/lib/globalConstant/adminActivityLogs'),
  emailServiceApiCallHookConstants = require(rootPrefix + '/lib/globalConstant/emailServiceApiCallHook');

/**
 * Class to send email for resubmission by admin.
 *
 * @class SendEmailForReSubmission
 */
class SendEmailForReSubmission extends ServiceBase {
  /**
   * Constructor to send email for resubmission by admin.
   *
   * @param {object} params
   * @param {array} params.user_id: User id to be send email for resubmission by admin.
   * @param {object} params.current_admin: current admin.
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.userId = params.user_id;
    oThis.currentAdminId = params.current_admin.id;
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<result>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchAndValidateUser();

    await oThis._sendResubmissionEmail();

    await oThis._logAdminActivity();

    return responseHelper.successWithData({});
  }

  /**
   * Fetch users.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchAndValidateUser() {
    const oThis = this;

    const cacheRsp = await new UsersCache({ ids: [oThis.userId] }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_a_sefrs_1',
          api_error_identifier: 'invalid_params',
          params_error_identifiers: ['invalid_user_id'],
          debug_options: {}
        })
      );
    }

    const userObj = cacheRsp.data[oThis.userId];

    if (userObj.status !== userConstants.activeStatus) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_a_sefrs_2',
          api_error_identifier: 'could_not_proceed',
          params_error_identifiers: ['user_inactive'],
          debug_options: {}
        })
      );
    }

    if (CommonValidators.isVarNullOrUndefined(userObj.email)) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_a_sefrs_3',
          api_error_identifier: 'could_not_proceed',
          params_error_identifiers: ['email_not_double_optin'],
          debug_options: {}
        })
      );
    }

    if (UserModel.isUserApprovedCreator(userObj)) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_a_sefrs_4',
          api_error_identifier: 'could_not_proceed',
          params_error_identifiers: ['user_already_approved'],
          debug_options: {}
        })
      );
    }

    if (UserModel.isUserDeniedCreator(userObj)) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_a_sefrs_5',
          api_error_identifier: 'could_not_proceed',
          params_error_identifiers: ['user_already_denied_as_creator'],
          debug_options: {}
        })
      );
    }
  }

  /**
   * Send resubmission email.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _sendResubmissionEmail() {
    const oThis = this;

    const transactionalMailParams = {
      receiverEntityId: 0,
      receiverEntityKind: emailServiceApiCallHookConstants.hookParamsInternalEmailEntityKind,
      templateName: emailServiceApiCallHookConstants.reportIssueTemplateName,
      templateVars: Object.assign(
        {
          pepo_api_domain: 1,
          receiverEmail: emailConstants.reportIssue
        },
        oThis.templateVars
      )
    };

    return new SendTransactionalMail(transactionalMailParams).perform();
  }

  /**
   * Log admin activity.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _logAdminActivity() {
    const oThis = this;

    await new ActivityLogModel({}).insertAction({
      adminId: oThis.currentAdminId,
      actionOn: oThis.userId,
      action: adminActivityLogConstants.emailSentForResubmission
    });
  }
}

module.exports = SendEmailForReSubmission;
