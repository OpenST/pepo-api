/**
 *
 * This class is to process hooks specifically related to pepo campaigns.
 *
 * @module executables/hookProcessors/EmailServiceAPICall
 */

const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  HookProcessorsBase = require(rootPrefix + '/executables/hookProcessors/Base'),
  SendTransactionalMail = require(rootPrefix + '/lib/hookProcessor/SendTransactionalMail'),
  EmailServiceAPICallHookModel = require(rootPrefix + '/app/models/mysql/EmailServiceAPICallHook'),
  emailServiceApiCallHookConstants = require(rootPrefix + '/lib/globalConstant/emailServiceApiCallHook');

let ModelKlass;
/**
 * Class for EmailServiceApicall
 *
 * @class
 */
class EmailServiceApiCall extends HookProcessorsBase {
  /**
   * Constructor
   *
   * @constructor
   */
  constructor(params) {
    super(params);
  }

  /**
   * Hook model class
   *
   * @returns {*}
   */
  get hookModelKlass() {
    if (!ModelKlass) {
      ModelKlass = EmailServiceAPICallHookModel;
      return ModelKlass;
    }
    return ModelKlass;
  }

  /**
   * Function which will process the hook
   *
   * @returns {Promise<void>}
   * @private
   */
  async _processHook() {
    const oThis = this;

    let HookProcessorKlass = oThis.getHookProcessorClass(),
      response = new HookProcessorKlass(oThis.hook).perform();

    if (response.isSuccess()) {
      oThis.successResponse[oThis.hook.id] = response.data;
    } else {
      if (
        response.data['error'] == 'VALIDATION_ERROR' &&
        response.data['error_message'] &&
        typeof response.data['error_message'] === 'object' &&
        response.data['error_message']['subscription_status']
      ) {
        oThis.failedHookToBeIgnored[oThis.hook.id] = response.data;
      } else {
        oThis.failedHookToBeRetried[oThis.hook.id] = response.data;
      }
    }
  }

  /**
   * Returns the concrete hook processor class.
   *
   * @returns {any}
   */
  getHookProcessorClass() {
    const oThis = this;

    switch (oThis.hook.eventType) {
      case emailServiceApiCallHookConstants.sendTransactionalEmailEventType: {
        return SendTransactionalMail;
      }
      default: {
        throw new Error('Unsupported event type');
      }
    }
  }

  /**
   * Function which will mark the hook processed
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateStatusToProcessed() {
    const oThis = this;

    for (let hookId in oThis.hooksToBeProcessed) {
      if (oThis.successResponse[hookId]) {
        await new EmailServiceAPICallHookModel().markStatusAsProcessed(hookId, oThis.successResponse[hookId]);
      }
    }
  }
}

module.exports = EmailServiceApiCall;
