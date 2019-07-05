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
   * @param {boolean} params.isProfileElement - true if its user profile element
   * @param {number} params.imageId - image id of the image table
   */
  constructor(params) {
    const oThis = this;

    oThis.userId = params.userId;
    oThis.dataKind = params.dataKind;
    oThis.isProfileElement = params.isProfileElement;
    oThis.imageId = params.imageId;
  }

  /**
   * Perform
   *
   * @return {Promise<void>}
   */
  async perform() {
    const oThis = this;

    let id = null;
    if (!oThis.isProfileElement) {
      id = oThis.imageId;
    } else {
      let userProfileElementRsp = await new UserProfileElementModel({}).fetchByUserIds({
        userIds: [oThis.userId]
      });

      id = userProfileElementRsp[oThis.userId][oThis.dataKind].data;

      await new UserProfileElementModel({}).deleteByUserIdAndKind({
        userId: oThis.userId,
        dataKind: oThis.dataKind
      });
    }

    await new ImageModel({}).deleteById({
      id: id
    });
  }
}

module.exports = DeleteImage;
