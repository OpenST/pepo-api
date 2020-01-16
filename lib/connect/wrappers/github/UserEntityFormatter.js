const rootPrefix = '../../../..',
  userConstants = require(rootPrefix + '/lib/globalConstant/user');

/**
 * Class for github user entity formatter.
 *
 * @class GithubUserEntityFormatter
 */
class GithubUserEntityFormatter {
  /**
   * Constructor for github user entity formatter.
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

  get userName() {
    const oThis = this;

    return oThis.userData.login;
  }

  get name() {
    const oThis = this;

    return oThis.userData.name;
  }

  get formattedName() {
    const oThis = this;

    let name = oThis.name;
    return name.substring(0, userConstants.nameLengthMaxLimit);
  }

  get profileImageUrl() {
    const oThis = this;

    return oThis.userData.avatar_url;
  }

  get email() {
    const oThis = this;

    return oThis.userData.email;
  }

  get location() {
    const oThis = this;

    return oThis.userData.location;
  }

  get bio() {
    const oThis = this;

    return oThis.userData.bio;
  }
}

module.exports = GithubUserEntityFormatter;
