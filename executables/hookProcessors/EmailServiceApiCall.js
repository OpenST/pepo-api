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
  EmailServiceAPICallHookModel = require(rootPrefix + '/app/models/mysql/EmailServiceAPICallHook');

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
  }
}

module.exports = EmailServiceApiCall;
