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

  get statuses() {
    const oThis = this;

    return {
      '1': oThis.activeStatus,
      '2': oThis.inActiveStatus
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

  get isApprovedCreatorProperty() {
    return 'IS_APPROVED_CREATOR';
  }
  // User properties end.

  get properties() {
    const oThis = this;

    if (!propertiesHash) {
      propertiesHash = {
        '1': oThis.hasEmailLoginProperty,
        '2': oThis.hasTwitterLoginProperty,
        '4': oThis.isApprovedCreatorProperty
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

  get nameLengthMaxLimit() {
    return 25;
  }
}

module.exports = new User();
