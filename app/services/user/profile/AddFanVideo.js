const rootPrefix = '../../../..',
  UpdateProfileBase = require(rootPrefix + '/app/services/user/profile/Base'),
  UserModelKlass = require(rootPrefix + '/app/models/mysql/User'),
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  UserProfileElementModel = require(rootPrefix + '/app/models/mysql/UserProfileElement'),
  userProfileElementConst = require(rootPrefix + '/lib/globalConstant/userProfileElement'),
  videoLib = require(rootPrefix + '/lib/videoLib');

/**
 * Class for fan video and image save
 *
 * @class
 */
class AddFanVideo extends UpdateProfileBase {
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
   * @param {boolean} params.isExternalUrl - video source is other than s3 upload
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.videoUrl = params.video_url;
    oThis.posterImageUrl = params.poster_image_url;
    oThis.videoWidth = params.video_width;
    oThis.videoHeight = params.video_height;
    oThis.videoSize = params.video_size;
    oThis.imageWidth = params.image_width;
    oThis.imageHeight = params.image_height;
    oThis.imageSize = params.image_size;
    oThis.isExternalUrl = params.isExternalUrl;
    oThis.videoId = null;
  }

  /**
   * Validate Params
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validateParams() {
    const oThis = this;

    let resp = videoLib.validateVideoObj({ video_url: oThis.videoUrl, isExternalUrl: oThis.isExternalUrl });
    if (resp.isFailure()) {
      return Promise.reject(resp);
    }
  }

  /**
   * Update user profile video
   *
   * @return {Promise<void>}
   * @private
   */
  async _updateProfileElements() {
    const oThis = this;

    let resp = await videoLib.validateAndSave({
      videoUrl: oThis.videoUrl,
      size: oThis.videoSize,
      width: oThis.videoWidth,
      height: oThis.videoHeight,
      posterImageUrl: oThis.posterImageUrl,
      posterImageSize: oThis.imageSize,
      posterImageWidth: oThis.imageWidth,
      posterImageHeight: oThis.imageHeight,
      isExternalUrl: oThis.isExternalUrl
    });
    if (resp.isFailure()) {
      return Promise.reject(resp);
    }

    let videoObj = resp.data,
      videoId = Object.keys(videoObj)[0],
      coverImageId = videoObj[videoId].posterImageId;

    if (videoId) {
      await oThis._addProfileElement(videoId, userProfileElementConst.coverVideoIdKind);
    }

    if (coverImageId) {
      await oThis._addProfileElement(coverImageId, userProfileElementConst.coverImageIdKind);
    }
  }

  /**
   * Add entity in profile elements
   *
   * @param entityId
   * @param entityKind
   * @returns {Promise<void>}
   * @private
   */
  async _addProfileElement(entityId, entityKind) {
    const oThis = this;

    let profileElementObj = oThis.profileElements[entityKind];
    if (CommonValidator.validateObject(profileElementObj)) {
      await new UserProfileElementModel()
        .update({
          data: entityId
        })
        .where({ id: profileElementObj.id })
        .fire();
    } else {
      await new UserProfileElementModel()
        .insert({
          user_id: oThis.userId,
          data_kind: userProfileElementConst.invertedKinds[entityKind],
          data: entityId
        })
        .fire();
    }
  }

  /**
   * Update user
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateUser() {}
}

module.exports = AddFanVideo;
