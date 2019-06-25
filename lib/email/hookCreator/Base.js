const rootPrefix = '../../..',
  HookProcessorsBase = require(rootPrefix + '/executables/hookProcessors/Base'),
  EmailServiceAPICallHookModel = require(rootPrefix + '/app/models/mysql/EmailServiceAPICallHook'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

class HookCreatorBase {
  /**
   * Constructor for HookCreatorBase.
   *
   * @param params
   * @param {number} params.receiverEntityId - Receiver entity id that would go into hooks table
   * @param {string} params.receiverEntityKind - Receiver entity kind
   * @param {string} [params.customDescription] - Description which would be logged in email service hooks table
   * @param {hash} [params.customAttributes] - Attribute which are to be set for this email
   *
   */
  constructor(params) {
    const oThis = this;

    oThis.receiverEntityId = params.receiverEntityId;
    oThis.receiverEntityKind = params.receiverEntityKind;
    oThis.customDescription = params.customDescription;
    oThis.customAttributes = params.customAttributes;
  }

  async perform() {}

  _getEventType() {}

  _handleEvent() {}

  _validateReceiverEntity() {}

  _validateCustomVariables() {}

  /**
   * Create hook in email service apu call hooks table.
   *
   * @param params
   * @returns {Promise<void>}
   * @private
   */
  async _createHook(params) {
    const oThis = this;

    await new EmailServiceAPICallHookModel()
      .insert({
        receiver_entity_id: oThis.receiverEntityId,
        receiver_entity_kind: oThis.receiverEntityKind,
        event_type: oThis._getEventType(),
        execution_timestamp: params.executionTimestamp || basicHelper.getCurrentTimestampInSeconds(),
        custom_description: oThis.customDescription,
        params: params
      })
      .fire();
  }
}
