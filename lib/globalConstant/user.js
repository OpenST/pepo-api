'use strict';
/**
 * Constants for users.
 *
 * @module lib/globalConstant/user
 */

const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses, propertiesHash, invertedPropertiesHash;

/**
 * Class for users.
 *
 * @class
 */
class User {
  /**
   * Constructor for staker whitelisted addresses.
   *
   * @constructor
   */
  constructor() {}

  get activeStatus() {
    return 'ACTIVE';
  }

  get inActiveStatus() {
    return 'INACTIVE';
  }

  get blockedStatus() {
    return 'BLOCKED';
  }

  get statuses() {
    const oThis = this;

    return {
      '1': oThis.activeStatus,
      '2': oThis.inActiveStatus,
      '3': oThis.blockedStatus
    };
  }

  get invertedStatuses() {
    const oThis = this;

    if (invertedStatuses) {
      return invertedStatuses;
    }

    invertedStatuses = util.invert(oThis.statuses);

    return invertedStatuses;
  }

  get properties() {
    const oThis = this;

    if (!propertiesHash) {
      propertiesHash = {};
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

  get loginCookieName() {
    return 'pla';
  }

  get cookieExpiryTime() {
    return 30 * 60;
  }
}

module.exports = new User();
