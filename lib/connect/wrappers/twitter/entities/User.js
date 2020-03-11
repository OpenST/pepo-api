const rootPrefix = '../../../../..',
  imageLib = require(rootPrefix + '/lib/imageLib'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user');

/**
 * Class for Twitter Entity - User.
 *
 * @class UserTwitterEntity
 */
class UserTwitterEntity {
  /**
   * Constructor for user formatter.
   *
   * @param {object} params
   *
   * @augments Twitter User Entity
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

  get idStr() {
    const oThis = this;

    return oThis.userData.id_str;
  }

  get handle() {
    const oThis = this;

    return oThis.userData.screen_name;
  }

  get name() {
    const oThis = this;

    return oThis.userData.name;
  }

  get formattedName() {
    const oThis = this;

    let name = oThis.name;
    return name.substring(0, userConstants.nameLengthMaxLimit);

    // if (CommonValidators.validateName(name)) {
    //   return name;
    // } else if (CommonValidators.validateName(oThis.handle)) {
    //   return oThis.handle;
    // }

    // return 'Name';
  }

  get url() {
    const oThis = this;

    return oThis.userData.url;
  }

  get description() {
    const oThis = this;

    return oThis.userData.description;
  }

  get profileImageUrl() {
    const oThis = this;

    return oThis.userData.profile_image_url_https;
  }

  get nonDefaultProfileImageUrl() {
    const oThis = this;

    if (oThis.userData.default_profile_image) {
      return null;
    }

    let url = oThis.profileImageUrl;

    url = url.replace(/_normal(\.[a-z]+$)/i, '$1');

    return url;
  }

  get nonDefaultProfileImageShortUrl() {
    const oThis = this;

    let nDurl = oThis.nonDefaultProfileImageUrl;

    if (!nDurl) {
      return null;
    }

    let shortUrlResp = imageLib.shortenUrl({
      imageUrl: nDurl,
      isExternalUrl: true
    });

    if (shortUrlResp.isFailure()) {
      return null;
    }

    return shortUrlResp.data.shortUrl;
  }

  get email() {
    const oThis = this;

    if (oThis.userData.email) {
      return oThis.userData.email.toLowerCase();
    } else {
      return null;
    }
  }

  get location() {
    const oThis = this;

    return oThis.userData.location;
  }
}

module.exports = UserTwitterEntity;
