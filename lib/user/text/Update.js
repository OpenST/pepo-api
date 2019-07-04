const rootPrefix = '../../..',
  TextModel = require(rootPrefix + '/app/models/mysql/Text'),
  UserProfileElementModel = require(rootPrefix + '/app/models/mysql/UserProfileElement');

class UpdateText {
  /**
   * @constructor
   *
   * @param params
   * @param {string} params.text - text to update
   * @param {number} params.userId - user id
   * @param {string} params.dataKind - text element data kind. Refer user profile element constants
   */
  constructor(params) {
    const oThis = this;

    oThis.text = params.text;
    oThis.userId = params.userId;
    oThis.dataKind = params.dataKind;
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
      id: elementData[oThis.dataKind].data,
      text: oThis.text
    });
  }
}

module.exports = UpdateText;
