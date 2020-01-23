const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses, propertiesHash, invertedPropertiesHash;

/**
 * Class for users constants.
 *
 * @class User
 */
class User {
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

    invertedStatuses = invertedStatuses || util.invert(oThis.statuses);

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

  get isDeniedCreatorProperty() {
    return 'IS_DENIED_CREATOR';
  }

  get hasAppleLoginProperty() {
    return 'HAS_APPLE_LOGIN';
  }

  get hasGithubLoginProperty() {
    return 'HAS_GITHUB_LOGIN';
  }

  get hasGoogleLoginProperty() {
    return 'HAS_GOOGLE_LOGIN';
  }
  // User properties end.

  get properties() {
    const oThis = this;

    propertiesHash = propertiesHash || {
      '1': oThis.hasEmailLoginProperty,
      '2': oThis.hasTwitterLoginProperty,
      '4': oThis.isApprovedCreatorProperty,
      '8': oThis.isDeniedCreatorProperty,
      '16': oThis.hasAppleLoginProperty,
      '32': oThis.hasGithubLoginProperty,
      '64': oThis.hasGoogleLoginProperty
    };

    return propertiesHash;
  }

  get invertedProperties() {
    const oThis = this;

    invertedPropertiesHash = invertedPropertiesHash || util.invert(oThis.properties);

    return invertedPropertiesHash;
  }

  get loginCookieName() {
    return 'pla';
  }

  get loginFromWebviewCookieName() {
    return 'wvl';
  }

  get loginStoreCookieName() {
    return 'sl';
  }

  get utmCookieName() {
    return 'putm';
  }

  get cookieExpiryTime() {
    return 60 * 60 * 24 * 30; // 30 days
  }

  get shortLivedAuthTokenExpiry() {
    return 60 * 5; // 5 minutes
  }

  get nameLengthMaxLimit() {
    return 30;
  }

  get ascendingSortByValue() {
    return 'asc';
  }

  get descendingSortByValue() {
    return 'desc';
  }

  get pendingCreatorFilterValue() {
    return 'pending';
  }

  get approvedCreatorFilterValue() {
    return 'approved';
  }

  get deniedCreatorFilterValue() {
    return 'denied';
  }
}

module.exports = new User();
