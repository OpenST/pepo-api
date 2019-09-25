const rootPrefix = '../../..',
  HookCreatorBase = require(rootPrefix + '/lib/email/hookCreator/Base'),
  emailServiceApiCallHookConstants = require(rootPrefix + '/lib/globalConstant/emailServiceApiCallHook');

class RemoveContact extends HookCreatorBase {
  /**
   * Constructor for RemoveContact.
   *
   * @param params
   * @param {number} params.receiverEntityId - Receiver entity id that would go into hooks table
   * @param {string} params.receiverEntityKind - Receiver entity kind
   * @param {string} [params.customDescription] - Description which would be logged in email service hooks table
   *
   * @augments HookCreatorBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);
  }

  /**
   * Get an event type.
   *
   * @returns {string}
   * @private
   */
  get _eventType() {
    return emailServiceApiCallHookConstants.removeContactEventType;
  }
}

module.exports = RemoveContact;
