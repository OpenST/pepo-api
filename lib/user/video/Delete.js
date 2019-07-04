const rootPrefix = '../../..',
  VideoModel = require(rootPrefix + '/app/models/mysql/Video'),
  ImageModel = require(rootPrefix + '/app/models/mysql/Image'),
  UserProfileElementModel = require(rootPrefix + '/app/models/mysql/UserProfileElement'),
  userProfileElementConst = require(rootPrefix + '/lib/globalConstant/userProfileElement');

class DeleteVideo {
  /**
   * @constructor
   *
   * @param params
   * @param {number} params.userId - user id
   * @param {number} params.posterImageId - poster image id
   * @param {string} params.status - status of resize
   */
  constructor(params) {
    const oThis = this;

    oThis.userId = params.userId;
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
    let videoId = elementData[userProfileElementConst.coverVideoKind].data;
    let videoRsp = await new VideoModel({}).fetchByIds([videoId]);
    let elementDataForVideo = videoRsp[videoId];

    await new ImageModel({}).deleteById({
      id: elementDataForVideo.posterImageId
    });

    await new VideoModel({}).deleteById({
      id: elementDataForVideo.id
    });

    await new UserProfileElementModel({}).deleteByUserIdAndKind({
      userId: oThis.userId,
      dataKind: userProfileElementConst.coverVideoKind
    });
  }
}

module.exports = DeleteVideo;
