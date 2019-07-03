const rootPrefix = '../../..',
  TextModel = require(rootPrefix + '/app/models/mysql/Text'),
  UserProfileElementModel = require(rootPrefix + '/app/models/mysql/UserProfileElement');

class DeleteText {
  /**
   * @constructor
   *
   * @param params
   * @param {number} params.userId - user id
   * @param {string} params.textKind - text element kind. Refer user profile element constants
   */
  constructor(params) {
    const oThis = this;

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

    await new UserProfileElementModel({}).deleteByUserIdAndKind({
      userId: oThis.userId,
      dataKind: oThis.textKind
    });

    await new TextModel({}).deleteById({
      id: elementData.data
    });
  }
}

module.exports = DeleteText;
