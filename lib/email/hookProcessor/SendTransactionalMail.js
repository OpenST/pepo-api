const rootPrefix = '../../..',
  HookProcessorBase = require(rootPrefix + '/lib/email/hookProcessor/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  pepoCampaignsObject = require(rootPrefix + '/lib/email/services/pepoCampaigns');

class SendTransactionalMail extends HookProcessorBase {
  /**
   * Constructor for SendTransactionalMail.
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
  async _validate() {
    const oThis = this;

    oThis.sendMailParams = oThis.hook.params;

    if (!oThis.sendMailParams.templateVars || !oThis.sendMailParams.templateVars.pepoApiDomain) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_e_hp_stm_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { sendMailParams: oThis.sendMailParams }
        })
      );
    }
  }

  /**
   * Process hook.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _processHook() {
    const oThis = this,
      email = ''; // Get this email from some table depending upon the receiver entity kind.

    const sendTransactionMailResp = await pepoCampaignsObject.sendTransactionalMail(
      email,
      oThis.sendMailParams.templateName,
      oThis.sendMailParams.templateVars
    );

    if (sendTransactionMailResp.isFailure()) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_e_hp_stm_2',
          api_error_identifier: 'something_went_wrong',
          debug_options: { errorMsg: sendTransactionMailResp }
        })
      );
    }

    return sendTransactionMailResp;
  }
}

module.exports = SendTransactionalMail;
