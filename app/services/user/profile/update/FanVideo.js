const rootPrefix = '../../../../..',
  UrlModel = require(rootPrefix + '/app/models/mysql/Url'),
  FeedModel = require(rootPrefix + '/app/models/mysql/Feed'),
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  AddVideoDescription = require(rootPrefix + '/lib/video/AddDescription'),
  UpdateProfileBase = require(rootPrefix + '/app/services/user/profile/update/Base'),
  UserProfileElementModel = require(rootPrefix + '/app/models/mysql/UserProfileElement'),
  userProfileElementConst = require(rootPrefix + '/lib/globalConstant/userProfileElement'),
  VideoDetailsModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  VideoAddNotification = require(rootPrefix + '/lib/userNotificationPublisher/VideoAdd'),
  videoLib = require(rootPrefix + '/lib/videoLib'),
  urlConstants = require(rootPrefix + '/lib/globalConstant/url'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  feedsConstants = require(rootPrefix + '/lib/globalConstant/feed'),
  UserModelKlass = require(rootPrefix + '/app/models/mysql/User');

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
   * @param {string} [params.video_description]: Video description
   * @param {string} [params.link]: Link
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
    oThis.videoDescription = params.video_description;
    oThis.link = params.link;

    oThis.videoId = null;
    oThis.flushUserCache = false;
    oThis.flushUserProfileElementsCache = true;

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

    // If url is not valid, consider link as null.
    if (!CommonValidator.validateHttpBasedUrl(oThis.link)) {
      oThis.link = null;
    }

    if (oThis.link) {
      oThis.link = oThis.link.toLowerCase();
    }

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

    const linkIds = await oThis._addLink();

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
      isExternalUrl: oThis.isExternalUrl,
      linkIds: linkIds
    });

    if (resp.isFailure()) {
      return Promise.reject(resp);
    }

    oThis.videoId = resp.data.insertId;

    await new AddVideoDescription({
      videoDescription: oThis.videoDescription,
      videoId: oThis.videoId
    }).perform();

    const videoObj = resp.data.video,
      coverImageId = videoObj.posterImageId;

    if (oThis.videoId) {
      await oThis._addProfileElement(oThis.videoId, userProfileElementConst.coverVideoIdKind);
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
   * Add link in urls table.
   *
   * @returns {Promise<*>}
   * @private
   */
  async _addLink() {
    const oThis = this;

    if (oThis.link) {
      // If new url is added then insert in 2 tables
      let insertRsp = await new UrlModel({}).insertUrl({
        url: oThis.link,
        kind: urlConstants.socialUrlKind
      });

      return [insertRsp.insertId];
    }

    return null;
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

    // Feed needs to be added only if user is an approved creator.
    if (UserModelKlass.isUserApprovedCreator(oThis.userObj)) {
      await oThis._addFeed();
      // Notification would be published only if user is approved.
      await new VideoAddNotification({
        userId: oThis.profileUserId,
        videoId: oThis.videoId
      }).perform();
    }
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
