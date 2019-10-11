const rootPrefix = '../../..',
  HookProcessorBase = require(rootPrefix + '/lib/email/hookProcessor/Base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  pepoCampaignsWrapper = require(rootPrefix + '/lib/email/services/pepoCampaigns'),
  pepoCampaignsConstant = require(rootPrefix + '/lib/globalConstant/pepoCampaigns');

class AddContact extends HookProcessorBase {
  /**
   * Constructor for AddContact.
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
   * @returns {Promise<void>}
   * @private
   */
  async _processHook() {
    const oThis = this;

    let emailDetails = await oThis._getEmail(),
      email = emailDetails.email;

    const addContactResp = await pepoCampaignsWrapper.addContact(
      coreConstants.PEPO_CAMPAIGN_MASTER_LIST,
      email,
      oThis.hook.params.custom_attributes,
      oThis._userSettings
    );

    if (addContactResp.isFailure()) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_e_hp_ac_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { errorMsg: addContactResp }
        })
      );
    }

    return addContactResp;
  }

  /**
   * Get user settings
   *
   * @returns {{[p: string]: *}}
   * @private
   */
  get _userSettings() {
    return {
      [pepoCampaignsConstant.doubleOptInStatusUserSetting]: pepoCampaignsConstant.verifiedValue,
      [pepoCampaignsConstant.subscribeStatusUserSetting]: pepoCampaignsConstant.subscribedValue
    };
  }
}

module.exports = AddContact;
