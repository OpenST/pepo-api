const rootPrefix = '../../..',
  HookCreatorBase = require(rootPrefix + '/lib/email/hookCreator/Base'),
  emailServiceApiCallHookConstants = require(rootPrefix + '/lib/globalConstant/big/emailServiceApiCallHook');

/**
 * Class for removing contact from pepo campaigns.
 *
 * @class RemoveContact
 */
class RemoveContact extends HookCreatorBase {
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
