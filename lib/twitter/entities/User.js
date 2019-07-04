const rootPrefix = '../../..',
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

    return oThis.userData.name;
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

  get email() {
    const oThis = this;

    return oThis.userData.email;
  }
}

module.exports = UserTwitterEntity;
