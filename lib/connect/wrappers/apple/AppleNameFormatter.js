const rootPrefix = '../../../..';

/**
 * Class for apple name formatter.
 *
 * @class AppleNameFormatter
 */
class AppleNameFormatter {
  /**
   * Constructor for apple name formatter.
   *
   * @param {object} params
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.fullName = params.fullName;
    oThis.email = params.email;
  }

  get givenName() {
    const oThis = this;

    return oThis.fullName.givenName;
  }

  get familyName() {
    const oThis = this;

    return oThis.fullName.familyName;
  }

  get formattedName() {
    const oThis = this;

    if (oThis.givenName && oThis.familyName) {
      return oThis.givenName + ' ' + oThis.familyName;
    } else if (oThis.givenName) {
      return oThis.givenName;
    } else if (oThis.familyName) {
      return oThis.familyName;
    } else if (oThis.email) {
      let splitEmail = oThis.email.split('@');
      return splitEmail[0];
    } else {
      return null;
    }
  }

  get socialUserName() {
    const oThis = this;

    if (oThis.givenName) {
      return oThis.givenName;
    } else if (oThis.familyName) {
      return oThis.familyName;
    } else if (oThis.email) {
      let splitEmail = oThis.email.split('@');
      return splitEmail[0];
    } else {
      return null;
    }
  }
}

module.exports = AppleNameFormatter;
