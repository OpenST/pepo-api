const rootPrefix = '../../..',
  TextModel = require(rootPrefix + '/app/models/mysql/Text'),
  UserProfileElementModel = require(rootPrefix + '/app/models/mysql/UserProfileElement');

class CreateText {
  /**
   * @constructor
   *
   * @param params
   * @param {string} params.text - text to insert
   * @param {number} params.userId - user id
   * @param {string} params.textKind - text element kind. Refer user profile element constants
   */
  constructor(params) {
    const oThis = this;

    oThis.text = params.text;
    oThis.userId = params.userId;
    oThis.textKind = params.textKind;
  }

  /**
   * Perform
   *
   * @return {Promise<void>}
   */
  async perform() {
    const oThis = this;

    let insertRsp = await new TextModel({}).insertText({
      text: oThis.text
    });

    let insertId = insertRsp.insertId;

    await new UserProfileElementModel({}).insertElement({
      userId: oThis.userId,
      dataKind: oThis.textKind,
      data: insertId
    });
  }
}

module.exports = CreateText;
