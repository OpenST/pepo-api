const rootPrefix = '../../..',
  UserMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  userConstant = require(rootPrefix + '/lib/globalConstant/user'),
  UserEmailLogsModel = require(rootPrefix + '/app/models/mysql/UserEmailLogs'),
  PreLaunchInviteModel = require(rootPrefix + '/app/models/mysql/PreLaunchInvite'),
  preLaunchInviteConstants = require(rootPrefix + '/lib/globalConstant/preLaunchInvite'),
  SecureUserCache = require(rootPrefix + '/lib/cacheManagement/single/SecureUser'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  emailServiceApiCallHookConstants = require(rootPrefix + '/lib/globalConstant/emailServiceApiCallHook');

/**
 * Base class for hook processor.
 *
 * @class HookProcessorBase
 */
class HookProcessorBase {
  /**
   * Constructor class for hook processor.
   *
   * @param {object} params
   * @param {object} params.hook: db record(hook) of EmailServiceApiCallHook table
   *
   * @constructor
   *
   */
  constructor(params) {
    const oThis = this;

    oThis.hook = params.hook;

    oThis.email = null;
  }

  /**
   * Main performer for class.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis._validate();

    return oThis._processHook();
  }

  /**
   * Get email ID.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _getEmail() {
    const oThis = this;

    let emailDetails = {
      email: null,
      blockedStatus: 0
    };

    switch (emailServiceApiCallHookConstants.receiverEntityKinds[oThis.hook.receiverEntityKind]) {
      case emailServiceApiCallHookConstants.preLaunchInviteEntityKind: {
        const preLaunchInviteResponse = await new PreLaunchInviteModel().fetchById(oThis.hook.receiverEntityId);

        if (!preLaunchInviteResponse.email) {
          logger.error('Error while fetching data from pre_launch_invites table.');

          return Promise.reject(new Error('Error while fetching data from pre_launch_invites table.'));
        }

        if (preLaunchInviteResponse.status == preLaunchInviteConstants.blockedStatus) {
          emailDetails.blockedStatus = 1;
        }

        emailDetails.email = preLaunchInviteResponse.email;
        break;
      }

      case emailServiceApiCallHookConstants.emailDoubleOptInEntityKind: {
        const userEmailLogsResponse = await new UserEmailLogsModel().fetchEmailById(oThis.hook.receiverEntityId);

        if (!userEmailLogsResponse.email) {
          logger.error('Error while fetching data from user_email_logs table.');

          return Promise.reject(new Error('Error while fetching data from pre_launch_invites table.'));
        }

        emailDetails.email = userEmailLogsResponse.email;
        break;
      }

      case emailServiceApiCallHookConstants.redemptionReceiverEntityKind: {
        const userDetailsCacheRsp = await new UserMultiCache({ ids: [oThis.hook.receiverEntityId] }).fetch();
        if (userDetailsCacheRsp.isFailure()) {
          return Promise.reject(userDetailsCacheRsp);
        }

        const userDetailsCacheRspData = userDetailsCacheRsp.data[oThis.hook.receiverEntityId];

        if (!userDetailsCacheRspData.email) {
          logger.error('Error while fetching data from users table.');

          return Promise.reject(new Error('Error while fetching data from users table.'));
        }

        if (userDetailsCacheRspData.status != userConstant.activeStatus) {
          emailDetails.blockedStatus = 1;
        }
        emailDetails.email = userDetailsCacheRspData.email;
        break;
      }

      case emailServiceApiCallHookConstants.userEmailEntityKind: {
        const userCacheResp = await new SecureUserCache({ id: oThis.hook.receiverEntityId }).fetch(),
          userData = userCacheResp.data;

        if (!userData.email) {
          logger.error('Error while fetching data from users table.');

          return Promise.reject(new Error('Error while fetching data from users table.'));
        }

        if (userData.status != userConstant.activeStatus) {
          emailDetails.blockedStatus = 1;
        }
        emailDetails.email = userData.email;
        break;
      }

      case emailServiceApiCallHookConstants.hookParamsInternalEmailEntityKind: {
        if (oThis.sendMailParams.templateVars) {
          email = oThis.sendMailParams.templateVars.receiverEmail;
        }
        if (!email) {
          throw new Error(
            `Email is mandatory inside templateVars for -${oThis.hook.receiverEntityKind} for id-${oThis.hook.id}`
          );
        }
        break;
      }

      default: {
        throw new Error(`Invalid receiverEntityKind-${oThis.hook.receiverEntityKind} for id-${oThis.hook.id} `);
      }
    }

    return emailDetails;
  }

  /**
   * Validate.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validate() {
    throw new Error('Sub-class to implement _validate');
  }

  /**
   * Process hook.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _processHook() {
    throw new Error('Sub-class to implement _processHook');
  }
}

module.exports = HookProcessorBase;
