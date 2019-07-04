const rootPrefix = '../../..',
  ImageModel = require(rootPrefix + '/app/models/mysql/Image'),
  UserProfileElementModel = require(rootPrefix + '/app/models/mysql/UserProfileElement');

class DeleteImage {
  /**
   * @constructor
   *
   * @param params
   * @param {number} params.userId - user id
   * @param {string} params.dataKind - image kind. Refer user profile element constants
   */
  constructor(params) {
    const oThis = this;

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

    await new UserProfileElementModel({}).deleteByUserIdAndKind({
      userId: oThis.userId,
      dataKind: oThis.dataKind
    });

    await new ImageModel({}).deleteById({
      id: elementData[oThis.dataKind].data
    });
  }
}

module.exports = DeleteImage;
