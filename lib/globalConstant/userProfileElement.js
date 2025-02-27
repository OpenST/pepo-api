const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedKinds = null;

/**
 * Class for user profile elements.
 *
 * @class UserProfileElement
 */
class UserProfileElement {
  get bioIdKind() {
    return 'bioId';
  }

  get linkIdKind() {
    return 'linkId';
  }

  get locationIdKind() {
    return 'locationId';
  }

  get lifetimePurchaseLimitKind() {
    return 'lifetimePurchaseLimit';
  }

  get kinds() {
    const oThis = this;

    return {
      '3': oThis.bioIdKind,
      '4': oThis.linkIdKind,
      '5': oThis.lifetimePurchaseLimitKind,
      '6': oThis.locationIdKind
    };
  }

  get invertedKinds() {
    const oThis = this;

    invertedKinds = invertedKinds || util.invert(oThis.kinds);

    return invertedKinds;
  }
}

module.exports = new UserProfileElement();
