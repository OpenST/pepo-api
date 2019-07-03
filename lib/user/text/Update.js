const rootPrefix = '../../..',
  TextModel = require(rootPrefix + '/app/models/mysql/Text'),
  UserProfileElementModel = require(rootPrefix + '/app/models/mysql/UserProfileElement');

class UpdateText {
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

    let userProfileElementRsp = await new UserProfileElementModel({}).fetchByUserIds({
      userIds: [oThis.userId]
    });

    let elementData = userProfileElementRsp[oThis.userId];

    await new TextModel({}).updateById({
      id: elementData.data,
      text: oThis.text
    });
  }
}

module.exports = UpdateText;
