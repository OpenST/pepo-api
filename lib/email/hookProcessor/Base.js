const rootPrefix = '../../..',
  EmailServiceAPICallHookModel = require(rootPrefix + '/app/models/mysql/EmailServiceAPICallHook'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

class HookProcessorBase {
  /**
   * Constructor for HookProcessorBase.
   *
   * @param params
   * @param {number} params.hook - db record(hook) of EmailServiceApiCallHook table
   *
   */
  constructor(params) {
    const oThis = this;

    oThis.hook = params.hook;

    oThis.email = null;
  }

  async perform() {
    const oThis = this;

    oThis._validateAndSanitize();

    await oThis._setEmail();

    return await oThis._processHook();
  }

  async _setEmail() {
    const oThis = this;
  }

  _validateAndSanitize() {
    throw new Error('Sub-class to implement.');
  }

  _processHook() {
    throw new Error('Sub-class to implement.');
  }

  _createCustomAttributes() {
    throw new Error('Sub-class to implement.');
  }
}

module.exports = HookProcessorBase;
