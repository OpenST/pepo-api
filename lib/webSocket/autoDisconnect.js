const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

class AutoDisconnect {
  constructor() {
    const oThis = this;

    oThis.wsServerIdentifier = coreConstants.WS_SERVER_IDENTIFIER;

    oThis.processId = null;
    oThis.rabbitLoadDetailsMap = {};
  }

  async perform() {
    const oThis = this;
  }
}

module.exports = new AutoDisconnect();
