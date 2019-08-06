const rootPrefix = '../..',
  util = require(rootPrefix + '/lib/util');

let invertedServiceTypes;

/**
 * Class for user login constants.
 *
 * @class
 */
class UserLoginConstants {
  /**
   * Constructor for UserLogin.
   *
   * @constructor
   */
  constructor() {}

  get emailServiceType() {
    return 'email';
  }

  get twitterServiceType() {
    return 'twitter';
  }

  get serviceTypes() {
    const oThis = this;

    return {
      '1': oThis.emailServiceType,
      '2': oThis.twitterServiceType
    };
  }

  get invertedServiceTypes() {
    const oThis = this;

    if (invertedServiceTypes) {
      return invertedServiceTypes;
    }

    invertedServiceTypes = util.invert(oThis.serviceTypes);

    return invertedServiceTypes;
  }
}

module.exports = new UserLoginConstants();
