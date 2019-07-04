const rootPrefix = '../../..',
  UrlModel = require(rootPrefix + '/app/models/mysql/Url'),
  UserProfileElementModel = require(rootPrefix + '/app/models/mysql/UserProfileElement'),
  userProfileElementConst = require(rootPrefix + '/lib/globalConstant/userProfileElement');

class CreateText {
  /**
   * @constructor
   *
   * @param params
   * @param {string} params.url - text to insert
   * @param {number} params.userId - user id
   * @param {string} params.urlKind - url kind. Refer url constants.
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

    let insertRsp = await new UrlModel({}).insertUrl({
      url: oThis.url,
      kind: oThis.urlKind
    });

    let insertId = insertRsp.insertId;

    await new UserProfileElementModel({}).insertElement({
      userId: oThis.userId,
      dataKind: userProfileElementConst.urlKind,
      data: insertId
    });
  }
}

module.exports = CreateText;
