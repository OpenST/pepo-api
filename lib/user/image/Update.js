const rootPrefix = '../../..',
  ImageModel = require(rootPrefix + '/app/models/mysql/Image'),
  UserProfileElementModel = require(rootPrefix + '/app/models/mysql/UserProfileElement');

class UpdateImage {
  /**
   * @constructor
   *
   * @param params
   * @param {number} params.userId - user id
   * @param {object} params.resolutions - text to insert
   * @param {string} params.dataKind - data kind. Get it from user profile element constants
   * @param {string} params.status - status of resize
   * @param {boolean} params.isProfileElement - true if its user profile element
   * @param {number} params.imageId - image id of the image table
   */
  constructor(params) {
    const oThis = this;

    oThis.userId = params.userId;
    oThis.resolutions = params.resolutions;
    oThis.dataKind = params.dataKind;
    oThis.status = params.status;
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
    if (oThis.isProfileElement) {
      id = oThis.imageId;
    } else {
      let userProfileElementRsp = await new UserProfileElementModel({}).fetchByUserIds({
        userIds: [oThis.userId]
      });

      id = userProfileElementRsp[oThis.userId][oThis.dataKind].data;
    }
    await new ImageModel({}).updateById({
      id: id,
      status: oThis.status,
      resolutions: oThis.resolutions
    });
  }
}

module.exports = UpdateImage;
