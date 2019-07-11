const rootPrefix = '../../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

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
    return name.substring(0, 100);

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

    let sUrl = oThis.nonDefaultProfileImageUrl;

    return sUrl;
  }

  get email() {
    const oThis = this;

    return oThis.userData.email;
  }
}

module.exports = UserTwitterEntity;
