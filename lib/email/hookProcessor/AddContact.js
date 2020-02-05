const rootPrefix = '../../..',
  HookProcessorBase = require(rootPrefix + '/lib/email/hookProcessor/Base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  pepoCampaignsWrapper = require(rootPrefix + '/lib/email/services/pepoCampaigns'),
  pepoCampaignsConstant = require(rootPrefix + '/lib/globalConstant/pepoCampaigns');

/**
 * Class to add new contact in pepo campaigns.
 *
 * @class AddContact
 */
class AddContact extends HookProcessorBase {
  /**
   * Validate params.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validate() {
    // Do nothing.
  }

  /**
   * Process hook.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _processHook() {
    const oThis = this;

    const emailDetails = await oThis._getEmail(),
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
   * Get user settings.
   *
   * @returns {{}}
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
