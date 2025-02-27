const rootPrefix = '../../../../..',
  UrlModel = require(rootPrefix + '/app/models/mysql/Url'),
  FeedModel = require(rootPrefix + '/app/models/mysql/Feed'),
  UserModelKlass = require(rootPrefix + '/app/models/mysql/User'),
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  AddVideoDescription = require(rootPrefix + '/lib/addDescription/Video'),
  VideoDetailModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  ValidateVideoService = require(rootPrefix + '/app/services/video/Validate'),
  UpdateProfileBase = require(rootPrefix + '/app/services/user/profile/update/Base'),
  videoLib = require(rootPrefix + '/lib/videoLib'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  urlConstants = require(rootPrefix + '/lib/globalConstant/url'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  feedsConstants = require(rootPrefix + '/lib/globalConstant/feed'),
  videoConstants = require(rootPrefix + '/lib/globalConstant/video'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob'),
  entityTypeConstants = require(rootPrefix + '/lib/globalConstant/entityType'),
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
   * @param {number} params.video_height: video height
   * @param {number} params.video_duration: video duration
   * @param {number} params.video_duration_preference: video duration Preference
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
    oThis.videoDuration = params.video_duration;
    oThis.videoDurationPref = params.video_duration_preference;
    oThis.imageWidth = params.image_width;
    oThis.imageHeight = params.image_height;
    oThis.imageSize = params.image_size;
    oThis.isExternalUrl = params.isExternalUrl;
    oThis.videoDescription = params.video_description;
    oThis.link = params.link;
    oThis.perReplyAmountInWei = params.per_reply_amount_in_wei;

    oThis.videoId = null;
    oThis.addVideoParams = {};
    oThis.flushUserCache = false;
    oThis.flushUserProfileElementsCache = false;
    oThis.mentionedUserIds = [];
    oThis.feedId = null;

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

    if (CommonValidator.isVarNullOrUndefined(oThis.perReplyAmountInWei)) {
      oThis.perReplyAmountInWei = '10000000000000000000';
    }

    const validateVideoResp = await new ValidateVideoService({
      current_user: oThis.currentUser,
      video_description: oThis.videoDescription,
      per_reply_amount_in_wei: oThis.perReplyAmountInWei,
      link: oThis.link
    }).perform();

    if (validateVideoResp.isFailure()) {
      return Promise.reject(validateVideoResp);
    }

    // If url is not valid, consider link as null.
    if (!CommonValidator.validateVideoDescription(oThis.videoDescription)) {
      oThis.videoDescription = null;
    }

    // If url is not valid, consider link as null.
    if (!CommonValidator.validateGenericUrl(oThis.link)) {
      oThis.link = null;
    }

    oThis.addVideoParams = {
      userId: oThis.profileUserId,
      videoUrl: oThis.videoUrl,
      size: oThis.videoSize,
      width: oThis.videoWidth,
      height: oThis.videoHeight,
      duration: oThis.videoDuration,
      durationPref: oThis.videoDurationPref,
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
    oThis.videoDetailId = resp.data.videoDetailId;

    const addVideoDescriptionRsp = await new AddVideoDescription({
      videoDescription: oThis.videoDescription,
      videoId: oThis.videoId,
      isUserCreator: UserModelKlass.isUserApprovedCreator(oThis.userObj)
    }).perform();

    if (addVideoDescriptionRsp.isFailure()) {
      return Promise.reject(addVideoDescriptionRsp);
    }

    const addVideoDescriptionData = addVideoDescriptionRsp.data;

    oThis.mentionedUserIds = addVideoDescriptionData.mentionedUserIds;
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
    // Feed needs to be added for uploaded video.
    const oThis = this;

    const promisesArray = [];

    if (UserModelKlass.isUserApprovedCreator(oThis.userObj)) {
      // Feed needs to be added only if user is an approved creator.
      await oThis._addFeed();

      // Video notifications would be published only if user is approved.
      promisesArray.push(
        notificationJobEnqueue.enqueue(notificationJobConstants.videoNotificationsKind, {
          creatorUserId: oThis.profileUserId,
          videoId: oThis.videoId,
          mentionedUserIds: oThis.mentionedUserIds
        })
      );
    }

    /* If user is approved and globally muted, publish content monitoring msg
     else send request to admins to approve new creator.
     */
    if (UserModelKlass.isUserApprovedCreator(oThis.userObj)) {
      const messagePayload = {
        userId: oThis.profileUserId,
        videoId: oThis.videoId
      };

      promisesArray.push(bgJob.enqueue(bgJobConstants.slackContentVideoMonitoringJobTopic, messagePayload));
    } else {
      const messagePayloadForApproveCreator = {
        userId: oThis.profileUserId
      };
      promisesArray.push(bgJob.enqueue(bgJobConstants.approveNewCreatorJobTopic, messagePayloadForApproveCreator));
    }

    await Promise.all(promisesArray);
  }

  /**
   * Add feed for user video.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _addFeed() {
    const oThis = this;

    const feedInsertResp = await new FeedModel()
      .insert({
        primary_external_entity_id: oThis.videoId,
        kind: feedsConstants.invertedKinds[feedsConstants.fanUpdateKind],
        actor: oThis.profileUserId,
        pagination_identifier: oThis.paginationTimestamp
      })
      .fire();

    oThis.feedId = feedInsertResp.insertId;
  }

  /**
   * Flush caches.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _flushCaches() {
    const oThis = this;

    const promisesArray = [super._flushCaches()];

    if (oThis.feedId) {
      promisesArray.push(FeedModel.flushCache({ ids: [oThis.feedId] }));
    }
    promisesArray.push(VideoDetailModel.flushCache({ userId: oThis.profileUserId }));

    await Promise.all(promisesArray);
  }

  /**
   * Prepare service response.
   *
   * @returns {*|result}
   * @private
   */
  _prepareResponse() {
    const oThis = this;

    // NOTE: Front-end fires the video creation pixel and following response is necessary.
    return responseHelper.successWithData({
      [entityTypeConstants.userVideoList]: [
        {
          creatorUserId: oThis.profileUserId.toString(),
          updatedAt: Math.round(new Date() / 1000),
          videoId: oThis.videoId.toString(),
          videoDetailId: oThis.videoDetailId.toString()
        }
      ]
    });
  }
}

module.exports = UpdateFanVideo;
