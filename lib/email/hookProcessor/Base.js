const rootPrefix = '../../..',
  UserEmailLogsModel = require(rootPrefix + '/app/models/mysql/UserEmailLogs'),
  PreLaunchInviteModel = require(rootPrefix + '/app/models/mysql/PreLaunchInvite'),
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

    let email = null;

    switch (emailServiceApiCallHookConstants.receiverEntityKinds[oThis.hook.receiverEntityKind]) {
      case emailServiceApiCallHookConstants.preLaunchInviteEntityKind: {
        const preLaunchInviteResponse = await new PreLaunchInviteModel().fetchById(oThis.hook.receiverEntityId);

        if (!preLaunchInviteResponse.email) {
          logger.error('Error while fetching data from pre_launch_invites table.');

          return Promise.reject(new Error('Error while fetching data from pre_launch_invites table.'));
        }

        email = preLaunchInviteResponse.email;
        break;
      }
      case emailServiceApiCallHookConstants.emailDoubleOptInEntityKind: {
        const userEmailLogsResponse = await new UserEmailLogsModel()
          .select('email')
          .where({ id: oThis.hook.receiverEntityId })
          .fire();

        if (userEmailLogsResponse.length === 0 || !userEmailLogsResponse[0].email) {
          logger.error('Error while fetching data from user_email_logs table.');

          return Promise.reject(new Error('Error while fetching data from pre_launch_invites table.'));
        }

        email = userEmailLogsResponse[0].email;
        break;
      }
      default: {
        throw new Error(`Invalid receiverEntityKind-${oThis.hook.receiverEntityKind} for id-${oThis.hook.id} `);
      }
    }

    return email;
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
