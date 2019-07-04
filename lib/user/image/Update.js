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
   */
  constructor(params) {
    const oThis = this;

    oThis.userId = params.userId;
    oThis.resolutions = params.resolutions;
    oThis.dataKind = params.dataKind;
    oThis.status = params.status;
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

    await new ImageModel({}).updateById({
      id: elementData[oThis.dataKind].data,
      status: oThis.status,
      resolutions: oThis.resolutions
    });
  }
}

module.exports = UpdateImage;
