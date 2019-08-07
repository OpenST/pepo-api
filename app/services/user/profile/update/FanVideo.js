const rootPrefix = '../../../../..',
  FeedModel = require(rootPrefix + '/app/models/mysql/Feed'),
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  UpdateProfileBase = require(rootPrefix + '/app/services/user/profile/update/Base'),
  UserProfileElementModel = require(rootPrefix + '/app/models/mysql/UserProfileElement'),
  userProfileElementConst = require(rootPrefix + '/lib/globalConstant/userProfileElement'),
  VideoDetailsModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  VideoAddNotification = require(rootPrefix + '/lib/userNotificationPublisher/VideoAdd'),
  videoLib = require(rootPrefix + '/lib/videoLib'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  feedsConstants = require(rootPrefix + '/lib/globalConstant/feed');

/**
 * Class to update fan video and image save.
 *
 * @class UpdateFanVideo
 */
class UpdateFanVideo extends UpdateProfileBase {
  /**
   * Constructor to update fan video and image save.
   *
   * @param {object} params
   * @param {object} params.current_user
   * @param {number} params.profile_user_id
   * @param {string} params.video_url: s3 video url
   * @param {string} params.poster_image_url: s3 poster image url
   * @param {number} params.video_width: video width
   * @param {number} params.video_height {number}: video height
   * @param {number} params.video_size: video size
   * @param {number} params.image_width: image width
   * @param {number} params.image_height: image height
   * @param {number} params.image_size: image size
   * @param {boolean} params.isExternalUrl: video source is other than s3 upload
   *
   * @augments UpdateProfileBase
   *
   * @constructor
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
    oThis.flushUserCache = false;

    oThis.paginationTimestamp = Math.round(new Date() / 1000);
  }

  /**
   * Validate params.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validateParams() {
    const oThis = this;

    const resp = videoLib.validateVideoObj({ videoUrl: oThis.videoUrl, isExternalUrl: oThis.isExternalUrl });
    if (resp.isFailure()) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_u_p_fv_1',
          api_error_identifier: 'invalid_params',
          params_error_identifiers: ['invalid_video_url'],
          debug_options: {}
        })
      );
    }
  }

  /**
   * Check whether update is required or not.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _isUpdateRequired() {
    return responseHelper.successWithData({ noUpdates: false });
  }

  /**
   * Update user profile video.
   *
   * @sets oThis.videoId
   *
   * @return {Promise<void>}
   * @private
   */
  async _updateProfileElements() {
    const oThis = this;

    const resp = await videoLib.validateAndSave({
      userId: oThis.profileUserId,
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

    const videoObj = resp.data.video,
      coverImageId = videoObj.posterImageId;

    oThis.videoId = resp.data.insertId;

    if (oThis.videoId) {
      await oThis._addProfileElement(oThis.videoId, userProfileElementConst.coverVideoIdKind);

      await new VideoAddNotification({
        userId: oThis.profileUserId,
        videoId: oThis.videoId
      }).perform();
    }

    if (coverImageId) {
      await oThis._addProfileElement(coverImageId, userProfileElementConst.coverImageIdKind);
    }
  }

  /**
   * Add entity in profile elements.
   *
   * @param {number} entityId
   * @param {string} entityKind
   *
   * @returns {Promise<void>}
   * @private
   */
  async _addProfileElement(entityId, entityKind) {
    const oThis = this;

    const profileElementObj = oThis.profileElements[entityKind];
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
          user_id: oThis.profileUserId,
          data_kind: userProfileElementConst.invertedKinds[entityKind],
          data: entityId
        })
        .fire();
    }
  }

  /**
   * Update user.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateUser() {
    // No update is required in user.
  }

  /**
   * Other updates.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _extraUpdates() {
    // Feed needs to be added for uploaded video
    const oThis = this;
    await oThis._addFeed();
  }

  /**
   * Add feed for user video.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _addFeed() {
    const oThis = this;

    return new FeedModel()
      .insert({
        primary_external_entity_id: oThis.videoId,
        kind: feedsConstants.invertedKinds[feedsConstants.fanUpdateKind],
        actor: oThis.profileUserId,
        pagination_identifier: oThis.paginationTimestamp
      })
      .fire();
  }

  /**
   * Flush caches.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _flushCaches() {
    const oThis = this;

    const promisesArray = [];

    promisesArray.push(super._flushCaches());
    promisesArray.push(FeedModel.flushCache({ paginationTimestamp: oThis.paginationTimestamp }));
    promisesArray.push(VideoDetailsModel.flushCache({ userId: oThis.profileUserId }));

    await Promise.all(promisesArray);
  }
}

module.exports = UpdateFanVideo;
