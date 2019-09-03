const rootPrefix = '../../..',
  EmailServiceAPICallHookModel = require(rootPrefix + '/app/models/mysql/EmailServiceAPICallHook'),
  emailServiceApiCallHookConstants = require(rootPrefix + '/lib/globalConstant/emailServiceApiCallHook'),
  PreLaunchInviteModel = require(rootPrefix + '/app/models/mysql/PreLaunchInvite'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

class HookProcessorBase {
  /**
   * Constructor for HookProcessorBase.
   *
   * @param params
   * @param {hash} params.hook - db record(hook) of EmailServiceApiCallHook table
   *
   */
  constructor(params) {
    const oThis = this;

    oThis.hook = params.hook;
    oThis.email = null;
  }

  /**
   * Main performer method.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis._validate();

    return oThis._processHook();
  }

  /**
   * Validate.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _getEmail() {
    const oThis = this;
    let email = null;

    switch (emailServiceApiCallHookConstants.receiverEntityKinds[oThis.hook.receiverEntityKind]) {
      case emailServiceApiCallHookConstants.preLaunchInviteEntityKind: {
        let preLaunchInviteResponse = await new PreLaunchInviteModel().fetchById(oThis.hook.receiverEntityId);

        if (!preLaunchInviteResponse.email) {
          logger.error('Error while fetching data from pre_launch_invites table.');
          return Promise.reject(new Error('Error while fetching data from pre_launch_invites table.'));
        }

        email = preLaunchInviteResponse.email;
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
