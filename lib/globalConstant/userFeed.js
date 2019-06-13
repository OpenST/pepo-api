const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedStatuses, invertedKinds, invertedPrivacyTypes;

/**
 * Class for user feed constants
 *
 * @class
 */
class UserFeedConstants {
  /**
   * Constructor for Feeds.
   *
   * @constructor
   */
  constructor() {}

  get publicPrivacyType() {
    return 'PUBLIC';
  }

  get privatePrivacyType() {
    return 'PRIVATE';
  }

  get privacyTypes() {
    const oThis = this;

    return {
      '1': oThis.publicPrivacyType,
      '2': oThis.privatePrivacyType
    };
  }

  get invertedPrivacyTypes() {
    const oThis = this;

    if (invertedPrivacyTypes) {
      return invertedPrivacyTypes;
    }

    invertedPrivacyTypes = util.invert(oThis.privacyTypes);

    return invertedPrivacyTypes;
  }
}

module.exports = new UserFeedConstants();
