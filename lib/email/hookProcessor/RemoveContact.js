const rootPrefix = '../../..',
  HookProcessorBase = require(rootPrefix + '/lib/email/hookProcessor/Base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  pepoCampaignsWrapper = require(rootPrefix + '/lib/email/services/pepoCampaigns');

/**
 * Class to remove contact from pepo campaigns.
 *
 * @class RemoveContact
 */
class RemoveContact extends HookProcessorBase {
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

    const email = await oThis._getEmail();

    const removeContactResp = await pepoCampaignsWrapper.removeContact(coreConstants.PEPO_CAMPAIGN_MASTER_LIST, email);

    if (removeContactResp.isFailure()) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_e_hp_rc_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { errorMsg: removeContactResp }
        })
      );
    }

    return removeContactResp;
  }
}

module.exports = RemoveContact;
