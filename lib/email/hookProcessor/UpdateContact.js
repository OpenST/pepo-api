const rootPrefix = '../../..',
  HookProcessorBase = require(rootPrefix + '/lib/email/hookProcessor/Base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  pepoCampaignsWrapper = require(rootPrefix + '/lib/email/services/pepoCampaigns');

/**
 * Class to update contact in pepo campaigns.
 *
 * @class UpdateContact
 */
class UpdateContact extends HookProcessorBase {
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
   * @returns {Promise<*>}
   * @private
   */
  async _processHook() {
    const oThis = this;

    const emailDetails = await oThis._getEmail(),
      email = emailDetails.email;

    const updateContactResp = await pepoCampaignsWrapper.addContact(
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
