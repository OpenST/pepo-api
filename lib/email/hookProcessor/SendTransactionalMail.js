const rootPrefix = '../../..',
  EmailServiceAPICallHookModel = require(rootPrefix + '/app/models/mysql/EmailServiceAPICallHook'),
  HookProcessorBase = require(rootPrefix + '/lib/email/hookProcessor/Base'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

class SendTransactionalMail extends HookProcessorBase {
  constructor(params) {
    super(params);
  }

  _validateAndSanitize() {
    const oThis = this;
  }

  _processHook() {
    const oThis = this;

    const sendMailParams = oThis.hook.params;
  }
}

module.exports = SendTransactionalMail;
