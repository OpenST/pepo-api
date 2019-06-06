'use strict';
/**
 * Constants for token_users.
 *
 * @module lib/globalConstant/tokenUser
 */

const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedOstStatuses, propertiesHash, invertedPropertiesHash;

/**
 * Class for Token Users.
 *
 * @class
 */
class TokenUser {
  /**
   * Constructor for staker whitelisted addresses.
   *
   * @constructor
   */
  constructor() {}

  get createdOstStatus() {
    return 'created';
  }

  get activatingOstStatus() {
    return 'activating';
  }

  get activatedOstStatus() {
    return 'activated';
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
    return 'airdropDone';
  }

  get tokenHolderDeployedProperty() {
    return 'tokenHolderDeployed';
  }

  get properties() {
    const oThis = this;

    if (!propertiesHash) {
      propertiesHash = {
        '1': oThis.airdropDoneProperty,
        '2': oThis.tokenHolderDeployedProperty
      };
    }

    return propertiesHash;
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
