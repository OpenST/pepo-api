const rootPrefix = '../../../..',
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
    return oThis.userData.id;
  }

  get idStr() {
    return oThis.userData.id_str;
  }

  get handle() {
    return oThis.userData.screen_name;
  }

  get name() {
    return oThis.userData.name;
  }

  get formattedName() {
    return oThis.userData.name;
  }

  get url() {
    return oThis.userData.url;
  }

  get description() {
    return oThis.userData.description;
  }

  get profileImageUrl() {
    return oThis.userData.profile_image_url_https;
  }

  get email() {
    return oThis.userData.email;
  }
}

module.exports = UserTwitterEntity;
