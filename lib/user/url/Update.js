const rootPrefix = '../../..',
  UrlModel = require(rootPrefix + '/app/models/mysql/Url'),
  UserProfileElementModel = require(rootPrefix + '/app/models/mysql/UserProfileElement');

class UpdateUrl {
  /**
   * @constructor
   *
   * @param params
   * @param {string} params.url - url to update
   * @param {number} params.userId - user id
   * @param {string} params.urlKind - url kind. Refer url constants
   */
  constructor(params) {
    const oThis = this;

    oThis.url = params.url;
    oThis.userId = params.userId;
    oThis.urlKind = params.urlKind;
  }

  /**
   * Perform
   *
   * @return {Promise<void>}
   */
  async perform() {
    const oThis = this;

    let userProfileElementRsp = await new UserProfileElementModel({}).fetchByUserIds({
      userIds: [oThis.userId]
    });

    let elementData = userProfileElementRsp[oThis.userId];

    await new UrlModel({}).updateByIdAndKind({
      id: elementData.data,
      kind: oThis.urlKind,
      url: oThis.url
    });
  }
}

module.exports = UpdateUrl;
