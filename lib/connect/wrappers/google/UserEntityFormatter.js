const rootPrefix = '../../../..',
  userConstants = require(rootPrefix + '/lib/globalConstant/user');

/**
 * Class for google user entity formatter.
 *
 * @class GoogleUserEntityFormatter
 */
class GoogleUserEntityFormatter {
  /**
   * Constructor for google user entity formatter.
   *
   * @param {object} params
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.userData = params;
  }

  get id() {
    const oThis = this;

    return oThis.userData.id;
  }

  get email() {
    const oThis = this;

    return oThis.userData.email;
  }

  get verifiedEmail() {
    const oThis = this;

    return oThis.userData.verified_email;
  }

  get name() {
    const oThis = this;

    return oThis.userData.name;
  }

  get userName() {
    const oThis = this;

    return oThis.userData.name.replace(' ', '');
  }

  get givenName() {
    const oThis = this;

    return oThis.userData.given_name;
  }

  get familyName() {
    const oThis = this;

    return oThis.userData.family_name;
  }

  get profileImageUrl() {
    const oThis = this;

    return oThis.userData.picture;
  }

  get locale() {
    const oThis = this;

    return oThis.userData.locale;
  }

  get formattedName() {
    const oThis = this;

    let name = oThis.name;
    return name.substring(0, userConstants.nameLengthMaxLimit);
  }
}

module.exports = GoogleUserEntityFormatter;
