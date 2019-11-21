const rootPrefix = '../../../../..',
  UrlModel = require(rootPrefix + '/app/models/mysql/Url'),
  FeedModel = require(rootPrefix + '/app/models/mysql/Feed'),
  UserModelKlass = require(rootPrefix + '/app/models/mysql/User'),
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  AddVideoDescription = require(rootPrefix + '/lib/addDescription/Video'),
  VideoDetailsModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  UpdateProfileBase = require(rootPrefix + '/app/services/user/profile/update/Base'),
  videoLib = require(rootPrefix + '/lib/videoLib'),
  urlConstants = require(rootPrefix + '/lib/globalConstant/url'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  feedsConstants = require(rootPrefix + '/lib/globalConstant/feed'),
  videoConstants = require(rootPrefix + '/lib/globalConstant/video'),
  notificationJobEnqueue = require(rootPrefix + '/lib/rabbitMqEnqueue/notification'),
  notificationJobConstants = require(rootPrefix + '/lib/globalConstant/notificationJob');

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
   * @param {string/number} [params.per_reply_amount_in_wei]: Per reply amount in wei.
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
    oThis.perReplyAmountInWei = params.per_reply_amount_in_wei || 0;

    oThis.videoId = null;
    oThis.addVideoParams = {};
    oThis.flushUserCache = false;
    oThis.flushUserProfileElementsCache = false;
    oThis.mentionedUserIds = [];

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
    if (!CommonValidator.validateGenericUrl(oThis.link)) {
      oThis.link = null;
    }

    if (oThis.link) {
      oThis.link = oThis.link.toLowerCase();
    }

    oThis.addVideoParams = {
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
      videoKind: videoConstants.postVideoKind,
      perReplyAmountInWei: oThis.perReplyAmountInWei
    };
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

    oThis.addVideoParams.linkIds = await oThis._addLink();
    const resp = await videoLib.validateAndSave(oThis.addVideoParams);

    if (resp.isFailure()) {
      return Promise.reject(resp);
    }

    oThis.videoId = resp.data.videoId;

    const addVideoDescriptionRsp = await new AddVideoDescription({
      videoDescription: oThis.videoDescription,
      videoId: oThis.videoId,
      isUserCreator: UserModelKlass.isUserApprovedCreator(oThis.userObj),
      currentUserId: oThis.currentUserId
    }).perform();

    if (addVideoDescriptionRsp.isFailure()) {
      return Promise.reject(addVideoDescriptionRsp);
    }

    let addVideoDescriptionData = addVideoDescriptionRsp.data;

    console.log('addVideoDescriptionData--------', addVideoDescriptionData);

    oThis.mentionedUserIds = addVideoDescriptionData.mentionedUserIds;

    console.log('oThis.mentionedUserIds---2--------', oThis.mentionedUserIds);
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
      // If new url is added then insert in 2 tables.
      const insertRsp = await new UrlModel({}).insertUrl({
        url: oThis.link,
        kind: urlConstants.socialUrlKind
      });

      return [insertRsp.insertId];
    }

    return null;
  }

  /**
   * Update user.
   * If a new video is added and the user was denied in his previous attempt. This will put the user in approval status.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateUser() {
    const oThis = this;

    // Unset deny users as creator property if required.
    if (oThis.userObj.properties & userConstants.invertedProperties[userConstants.isDeniedCreatorProperty]) {
      const propertyVal = userConstants.invertedProperties[userConstants.isDeniedCreatorProperty];

      await new UserModelKlass()
        .update(['properties = properties ^ ?', propertyVal])
        .where({ id: oThis.profileUserId })
        .where(['properties = properties | ?', propertyVal])
        .fire();

      oThis.flushUserCache = true;
    }
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

    await oThis._publishAtMentionNotifications();

    // Feed needs to be added only if user is an approved creator.
    if (UserModelKlass.isUserApprovedCreator(oThis.userObj)) {
      await oThis._addFeed();

      // Notification would be published only if user is approved.
      await notificationJobEnqueue.enqueue(notificationJobConstants.videoAdd, {
        userId: oThis.profileUserId,
        videoId: oThis.videoId,
        mentionedUserIds: oThis.mentionedUserIds
      });
    }
  }

  /**  await oThis._publishNotifications();
   * Publish notifications
   * @returns {Promise<void>}
   * @private
   */
  async _publishAtMentionNotifications() {
    const oThis = this;

    if (oThis.mentionedUserIds.length === 0) {
      return;
    }

    // Notification would be published only if user is approved.
    await notificationJobEnqueue.enqueue(notificationJobConstants.userMention, {
      userId: oThis.currentUserId,
      videoId: oThis.videoId,
      mentionedUserIds: oThis.mentionedUserIds
    });
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
