const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedOstStatuses, propertiesHash, invertedPropertiesHash;

/**
 * Class for token users constants.
 *
 * @class TokenUser
 */
class TokenUser {
  get createdOstStatus() {
    return 'CREATED';
  }

  get activatingOstStatus() {
    return 'ACTIVATING';
  }

  get activatedOstStatus() {
    return 'ACTIVATED';
  }

  get ostStatuses() {
    const oThis = this;

    return {
      '1': oThis.createdOstStatus,
      '2': oThis.activatingOstStatus,
      '3': oThis.activatedOstStatus
    };
  }

  get invertedOstStatuses() {
    const oThis = this;

    if (invertedOstStatuses) {
      return invertedOstStatuses;
    }

    invertedOstStatuses = util.invert(oThis.ostStatuses);

    return invertedOstStatuses;
  }

  get airdropDoneProperty() {
    return 'AIRDROP_DONE';
  }

  get airdropStartedProperty() {
    return 'AIRDROP_STARTED';
  }

  get airdropFailedProperty() {
    return 'AIRDROP_FAILED';
  }

  get tokenHolderDeployedProperty() {
    return 'TOKEN_HOLDER_DEPLOYED';
  }

  get properties() {
    const oThis = this;

    if (!propertiesHash) {
      propertiesHash = {
        '1': oThis.tokenHolderDeployedProperty,
        '2': oThis.airdropStartedProperty,
        '4': oThis.airdropDoneProperty,
        '8': oThis.airdropFailedProperty
      };
    }

    return propertiesHash;
  }

  get validPropertiesArray() {
    const oThis = this;

    return [
      oThis.tokenHolderDeployedProperty,
      oThis.airdropStartedProperty,
      oThis.airdropDoneProperty,
      oThis.airdropFailedProperty
    ];
  }

  get invertedProperties() {
    const oThis = this;

    if (!invertedPropertiesHash) {
      invertedPropertiesHash = util.invert(oThis.properties);
    }

    return invertedPropertiesHash;
  }
}

module.exports = new TokenUser();
