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

  get maxMarkInactiveTriggerCount() {
    return 10;
  }

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

  // User properties start.
  get hasEmailLoginProperty() {
    return 'HAS_EMAIL_LOGIN';
  }

  get hasTwitterLoginProperty() {
    return 'HAS_TWITTER_LOGIN';
  }
  // User properties end.

  get properties() {
    const oThis = this;

    if (!propertiesHash) {
      propertiesHash = {
        '1': oThis.hasEmailLoginProperty,
        '2': oThis.hasTwitterLoginProperty
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

  get loginCookieName() {
    return 'pla';
  }

  get cookieExpiryTime() {
    return 60 * 60 * 24 * 30; // 30 days
  }
}

module.exports = new User();
