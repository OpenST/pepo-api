const rootPrefix = '../../../..',
  imageLib = require(rootPrefix + '/lib/imageLib'),
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

    if (name) {
      return name.substring(0, userConstants.nameLengthMaxLimit);
    } else if (oThis.email) {
      const splitEmail = oThis.email.split('@');
      return splitEmail[0];
    }

    return null;
  }

  get profileImageUrl() {
    const oThis = this;

    return oThis.userData.avatar_url;
  }

  get email() {
    const oThis = this;

    if (oThis.userData.email) {
      return oThis.userData.email.toLowerCase();
    } else {
      return null;
    }
  }

  set email(email) {
    const oThis = this;

    if (email) {
      oThis.userData.email = email;
    }

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

  get profileImageShortUrl() {
    const oThis = this;

    let fullUrl = oThis.profileImageUrl;

    if (!fullUrl) {
      return null;
    }

    let shortUrlResp = imageLib.shortenUrl({
      imageUrl: fullUrl,
      isExternalUrl: true
    });

    if (shortUrlResp.isFailure()) {
      return null;
    }

    return shortUrlResp.data.shortUrl;
  }
}

module.exports = GithubUserEntityFormatter;
