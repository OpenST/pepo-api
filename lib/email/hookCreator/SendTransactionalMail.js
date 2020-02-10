const rootPrefix = '../../..',
  HookCreatorBase = require(rootPrefix + '/lib/email/hookCreator/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  emailServiceApiCallHookConstants = require(rootPrefix + '/lib/globalConstant/big/emailServiceApiCallHook');

/**
 * Class to send transactional mail.
 *
 * @class SendTransactionalMail
 */
class SendTransactionalMail extends HookCreatorBase {
  /**
   * Constructor to send transactional mail.
   *
   * @param {object} params
   * @param {number} params.receiverEntityId: Receiver entity id that would go into hooks table
   * @param {string} params.receiverEntityKind: Receiver entity kind
   * @param {string} [params.customDescription]: Description which would be logged in email service hooks table
   * @param {string} params.templateName: Template name
   * @param {hash} params.templateVars: Template vars
   *
   * @augments HookCreatorBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.templateName = params.templateName;
    oThis.templateVars = params.templateVars;
  }

  /**
   * Validate specific data.
   *
   * @private
   */
  _validate() {
    const oThis = this;

    super._validate();

    if (!emailServiceApiCallHookConstants.supportedTemplatesMap[oThis.templateName]) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_e_hc_stm_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { templateName: oThis.templateName }
        })
      );
    }

    // NOTE: Here add specific validations according to the template vars keys.
    if (!oThis.templateVars || !Object.prototype.hasOwnProperty.call(oThis.templateVars, 'pepo_api_domain')) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_e_hc_stm_2',
          api_error_identifier: 'something_went_wrong',
          debug_options: { templateVars: oThis.templateVars }
        })
      );
    }
  }

  /**
   * Get an event type.
   *
   * @returns {string}
   * @private
   */
  get _eventType() {
    return emailServiceApiCallHookConstants.sendTransactionalEmailEventType;
  }

  /**
   * Create hook.
   *
   * @returns {Promise<*>}
   * @private
   */
  async _createHook() {
    const oThis = this;

    await super._createHook({
      templateName: oThis.templateName,
      templateVars: oThis.templateVars
    });
  }
}

module.exports = SendTransactionalMail;
