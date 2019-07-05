const rootPrefix = '../../..',
  UrlModel = require(rootPrefix + '/app/models/mysql/Url'),
  UserProfileElementModel = require(rootPrefix + '/app/models/mysql/UserProfileElement'),
  userProfileElementConst = require(rootPrefix + '/lib/globalConstant/userProfileElement');

class DeleteUrl {
  /**
   * @constructor
   *
   * @param params
   * @param {number} params.userId - user id
   * @param {string} params.urlKind - user id. Refer url constants
   */
  constructor(params) {
    const oThis = this;

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

    await new UserProfileElementModel({}).deleteByUserIdAndKind({
      userId: oThis.userId,
      dataKind: userProfileElementConst.linkIdKind
    });

    await new UrlModel({}).deleteByIdAndKind({
      id: elementData[userProfileElementConst.linkIdKind].data,
      kind: oThis.urlKind
    });
  }
}

module.exports = DeleteUrl;
