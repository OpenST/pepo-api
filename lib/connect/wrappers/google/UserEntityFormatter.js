const rootPrefix = '../../../..',
  imageLib = require(rootPrefix + '/lib/imageLib'),
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

    if (oThis.userData.email) {
      return oThis.userData.email.toLowerCase();
    } else {
      return null;
    }
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

module.exports = GoogleUserEntityFormatter;
