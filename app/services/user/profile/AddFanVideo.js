const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  UserProfileElementsByUserIdCache = require(rootPrefix + '/lib/cacheManagement/multi/UserProfileElementsByUserIds'),
  userProfileElementConst = require(rootPrefix + '/lib/globalConstant/userProfileElement.js'),
  CreateImage = require(rootPrefix + '/lib/user/image/Create'),
  UpdateImage = require(rootPrefix + '/lib/user/image/Update'),
  CreateVideo = require(rootPrefix + '/lib/user/video/Create'),
  UpdateVideo = require(rootPrefix + '/lib/user/video/Update'),
  GetResolution = require(rootPrefix + '/lib/user/image/GetResolution'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  imageConst = require(rootPrefix + '/lib/globalConstant/image');

/**
 * Class for fan video and image save
 *
 * @class
 */
class AddFanVideo extends ServiceBase {
  /**
   * @constructor
   *
   * @param params
   * @param params.user_id {number} - user id
   * @param params.s3_fan_video_url {string} - s3 video url
   * @param params.s3_video_poster_image_url {string} - s3 poster image url
   * @param params.video_width {number} - video width
   * @param params.video_height {number} - video height
   * @param params.video_size {number} - video size
   * @param params.image_width {number} - image width
   * @param params.image_height {number} - image height
   * @param params.image_size {number} - image size
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.userId = params.user_id;
    oThis.s3FanVideoUrl = params.s3_fan_video_url;
    oThis.s3VidePosterImageUrl = params.s3_video_poster_image_url;
    oThis.videoWidth = params.video_width;
    oThis.videoHeight = params.video_height;
    oThis.videoSize = params.video_size;
    oThis.imageWidth = params.image_width;
    oThis.imageHeight = params.image_height;
    oThis.imageSize = params.image_size;

    oThis.posterImageId = null;
  }

  /**
   * Perform
   *
   * @return {Promise<void>}
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._getUserProfileElements();

    await oThis._saveImage();

    await oThis._saveFanVideo();

    return responseHelper.successWithData({});
  }

  /**
   * Get user profile elements
   *
   * @return {Promise<void>}
   * @private
   */
  async _getUserProfileElements() {
    const oThis = this;

    let userProfileElementsByUserIdCache = new UserProfileElementsByUserIdCache({
      usersIds: [oThis.userId]
    });

    let cacheRsp = await userProfileElementsByUserIdCache.fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    oThis.profileElements = cacheRsp.data[oThis.userId];
  }

  /**
   * Save poster image
   *
   * @return {Promise<void>}
   * @private
   */
  async _saveImage() {
    const oThis = this;

    let getResolution = new GetResolution({
      userId: oThis.userId,
      url: oThis.s3VidePosterImageUrl,
      width: oThis.imageWidth,
      height: oThis.imageHeight,
      size: oThis.imageSize
    });

    oThis.resolutions = await getResolution.perform();

    if (oThis.profileElements.hasOwnProperty(userProfileElementConst.coverImageIdKind)) {
      oThis.updateIntent = true;
      await oThis._createImage();
    } else {
      await oThis._updateImage();
    }
  }

  /**
   * Create image
   *
   * @return {Promise<void>}
   * @private
   */
  async _createImage() {
    const oThis = this;

    let createImageObj = new CreateImage({
      userId: oThis.userId,
      resolutions: oThis.resolutions,
      elementKind: userProfileElementConst.coverImageIdKind,
      isProfileElement: true,
      status: imageConst.notResized
    });

    let insertRsp = await createImageObj.perform();

    oThis.posterImageId = insertRsp.insertId; // TODO: @santhosh - poster and cover will be different later
  }

  /**
   * Update image
   *
   * @return {Promise<void>}
   * @private
   */
  async _updateImage() {
    const oThis = this;

    let updateImageObj = new UpdateImage({
      userId: oThis.userId,
      resolutions: oThis.resolutions,
      dataKind: userProfileElementConst.coverImageIdKind,
      isProfileElement: true,
      status: imageConst.notResized
    });

    await updateImageObj.perform();
  }

  /**
   * Save fan video
   *
   * @return {Promise<void>}
   * @private
   */
  async _saveFanVideo() {
    const oThis = this;

    let getResolution = new GetResolution({
      userId: oThis.userId,
      url: oThis.s3FanVideoUrl,
      width: oThis.videoWidth,
      height: oThis.videoHeight,
      size: oThis.videoSize
    });

    oThis.resolutions = await getResolution.perform();

    if (oThis.updateIntent) {
      // TODO: @santhosh - cover and poster same for now
      let posterImageId = oThis.profileElements[userProfileElementConst.coverImageIdKind].data;

      let updateVideoObj = new UpdateVideo({
        userId: oThis.userId,
        resolutions: oThis.resolutions,
        posterImageId: posterImageId,
        status: imageConst.notResized
      });

      await updateVideoObj.perform();
    } else {
      let createVideoObj = new CreateVideo({
        userId: oThis.userId,
        resolutions: oThis.resolutions,
        posterImageId: oThis.posterImageId,
        status: imageConst.notResized
      });

      await createVideoObj.perform();
    }
  }
}

module.exports = AddFanVideo;
