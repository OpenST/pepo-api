const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let propertiesHash, invertedPropertiesHash;

/**
 * Class for twitter user connection constants.
 *
 * @class
 */
class TwitterUserConnectionConstants {
  /**
   * Constructor for twitter user extended constants.
   *
   * @constructor
   */
  constructor() {}

  get isTwitterUser2RegisteredProperty() {
    return 'isTwitterUser2Registered';
  }

  get isTwitterUser2ContributedToProperty() {
    return 'isTwitterUser2ContributedTo';
  }

  get properties() {
    const oThis = this;

    if (!propertiesHash) {
      propertiesHash = {
        '1': oThis.isTwitterUser2RegisteredProperty,
        '2': oThis.isTwitterUser2ContributedToProperty
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

module.exports = new TwitterUserConnectionConstants();
