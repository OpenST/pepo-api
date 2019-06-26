const rootPrefix = '../../..',
  HookProcessorBase = require(rootPrefix + '/lib/email/hookProcessor/Base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  pepoCampaignsObject = require(rootPrefix + '/lib/email/services/pepoCampaigns');

class UpdateContact extends HookProcessorBase {
  /**
   * Constructor for UpdateContact.
   *
   * @param params
   * @param {hash} params.hook
   *
   * @augments HookProcessorBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.sendMailParams = {};
  }

  /**
   * Validate params.
   *
   * @sets oThis.sendMailParams
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validate() {}

  /**
   * Process hook.
   *
   * @returns {Promise<*>}
   * @private
   */
  async _processHook() {
    const oThis = this,
      email = ''; // Get this email from some table depending upon the receiver entity kind.

    const updateContactResp = await pepoCampaignsObject.updateContact(
      coreConstants.PEPO_CAMPAIGN_MASTER_LIST,
      email,
      oThis.hook.params.customAttributes || {},
      oThis.hook.params.userSettings || {}
    );

    if (updateContactResp.isFailure()) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_e_hp_uc_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { errorMsg: updateContactResp }
        })
      );
    }

    return updateContactResp;
  }
}

module.exports = UpdateContact;
