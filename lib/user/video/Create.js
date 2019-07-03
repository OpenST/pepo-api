const rootPrefix = '../../..',
  VideoModel = require(rootPrefix + '/app/models/mysql/Video'),
  UserProfileElementModel = require(rootPrefix + '/app/models/mysql/UserProfileElement'),
  userProfileElementConst = require(rootPrefix + '/lib/globalConstant/userProfileElement');

class CreateVideo {
  /**
   * @constructor
   *
   * @param params
   * @param {number} params.userId - user id
   * @param {object} params.resolutions - text to insert
   * @param {number} params.posterImageId - poster image id
   * @param {string} params.status - status of resize
   */
  constructor(params) {
    const oThis = this;

    oThis.userId = params.userId;
    oThis.resolutions = params.resolutions;
    oThis.posterImageId = params.posterImageId;
    oThis.status = params.status;
  }

  /**
   * Perform
   *
   * @return {Promise<void>}
   */
  async perform() {
    const oThis = this;

    let insertRsp = await new VideoModel({}).insertVideo({
      resolutions: oThis.resolutions,
      posterImageId: oThis.posterImageId,
      status: oThis.status
    });

    let insertId = insertRsp.insertId;

    await new UserProfileElementModel({}).insertElement({
      userId: oThis.userId,
      dataKind: userProfileElementConst.coverVideoKind,
      data: insertId
    });
  }
}

module.exports = CreateVideo;
