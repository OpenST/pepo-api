const rootPrefix = '../../..',
  ImageModel = require(rootPrefix + '/app/models/mysql/Image'),
  UserProfileElementModel = require(rootPrefix + '/app/models/mysql/UserProfileElement');

class CreateImage {
  /**
   * @constructor
   *
   * @param params
   * @param {number} params.userId - user id
   * @param {object} params.resolutions - text to insert
   * @param {string} params.elementKind - element kind. Get it from user profile element constants
   * @param {string} params.status - status of resize
   */
  constructor(params) {
    const oThis = this;

    oThis.userId = params.userId;
    oThis.resolutions = params.resolutions;
    oThis.elementKind = params.elementKind;
    oThis.status = params.status;
  }

  /**
   * Perform
   *
   * @return {Promise<void>}
   */
  async perform() {
    const oThis = this;

    let insertRsp = await new ImageModel({}).insertImage({
      resolutions: oThis.resolutions,
      status: oThis.status
    });

    let insertId = insertRsp.insertId;

    await new UserProfileElementModel({}).insertElement({
      userId: oThis.userId,
      dataKind: oThis.elementKind,
      data: insertId
    });

    // TODO: @Santhosh - Enqueue for resizing
  }
}

module.exports = CreateImage;
