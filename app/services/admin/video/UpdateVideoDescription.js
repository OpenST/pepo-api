const rootPrefix = '../../../..',
  FilterTags = require(rootPrefix + '/lib/FilterOutTags'),
  FilterUrls = require(rootPrefix + '/lib/FilterOutUrls'),
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  TextModel = require(rootPrefix + '/app/models/mysql/Text'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  VideoTagModel = require(rootPrefix + '/app/models/mysql/VideoTag'),
  UsersCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  VideoDetailsModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  ActivityLogModel = require(rootPrefix + '/app/models/mysql/AdminActivityLog'),
  IncrementWeightsAndAddVideoTags = require(rootPrefix + '/lib/video/IncrementWeightsAndAddVideoTags'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  DecrementWeightsAndRemoveVideoTags = require(rootPrefix + '/lib/video/DecrementWeightsAndRemoveVideoTags'),
  textConstants = require(rootPrefix + '/lib/globalConstant/text'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  videoDetailsConstants = require(rootPrefix + '/lib/globalConstant/videoDetail'),
  adminActivityLogConstants = require(rootPrefix + '/lib/globalConstant/adminActivityLogs');

/**
 * Class to update video description.
 *
 * @class UpdateVideoDescription
 */
class UpdateVideoDescription extends ServiceBase {
  /**
   * Constructor to update video description.
   *
   * @param {object} params
   * @param {array} params.video_description: Video description of video by admin.
   * @param {array} params.video_id: Video id to edited.
   * @param {object} params.current_admin: current admin.
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.videoId = params.video_id;
    oThis.videoDescription = params.video_description;
    oThis.currentAdmin = params.current_admin;

    oThis.currentAdminId = Number(oThis.currentAdmin.id);

    oThis.videoDetail = null;
    oThis.creatorUserId = null;
    oThis.textId = null;

    oThis.user = null;
    oThis.isUserCreator = null;

    oThis.text = null;
    oThis.tagsIds = [];

    oThis.urlIds = [];
  }

  /**
   * Async performer.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchVideoDetails();

    await oThis._fetchCreatorUser();

    const promiseArray = [
      oThis._decrementVideoTagsWeightForExistingDescription(),
      oThis._filterTags(),
      oThis._filterUrls()
    ];

    await Promise.all(promiseArray);

    await oThis._incrementWeightsAndAddVideoTags();

    await oThis._updateVideoDescription();

    await oThis._flushCache();

    await oThis._logAdminActivity();

    return responseHelper.successWithData({});
  }

  /**
   * Fetch the video details and the creator user id and performs validations on the video status.
   *
   * @sets oThis.videoDetails, oThis.creatorUserId, oThis.textId
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchVideoDetails() {
    const oThis = this;

    const videoDetailsCacheResponse = await new VideoDetailsByVideoIdsCache({ videoIds: [oThis.videoId] }).fetch();
    if (videoDetailsCacheResponse.isFailure()) {
      return Promise.reject(videoDetailsCacheResponse);
    }

    oThis.videoDetail = videoDetailsCacheResponse.data[oThis.videoId];
    oThis.creatorUserId = oThis.videoDetail.creatorUserId;
    oThis.textId = oThis.videoDetail.descriptionId || null;

    if (!oThis.creatorUserId || oThis.videoDetail.status === videoDetailsConstants.deletedStatus) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_a_v_uvd_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_video_id'],
          debug_options: { videoDetails: oThis.videoDetail }
        })
      );
    }
  }

  /**
   * Fetch the user details and performs validations on the user status.
   *
   * @sets oThis.user, oThis.isUserCreator
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchCreatorUser() {
    const oThis = this;

    const cacheRsp = await new UsersCache({ ids: [oThis.creatorUserId] }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_a_v_uvd_2',
          api_error_identifier: 'invalid_params',
          params_error_identifiers: ['invalid_user_id'],
          debug_options: {}
        })
      );
    }

    oThis.user = cacheRsp.data[oThis.creatorUserId];
    oThis.isUserCreator = UserModel.isUserApprovedCreator(oThis.user);

    if (oThis.user.status !== userConstants.activeStatus) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_a_v_uvd_3',
          api_error_identifier: 'could_not_proceed',
          params_error_identifiers: ['user_inactive'],
          debug_options: {}
        })
      );
    }
  }

  /**
   * Decrement video tags weight and remove video tags for existing video description.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _decrementVideoTagsWeightForExistingDescription() {
    const oThis = this;

    const queryRsp = await new VideoTagModel()
      .select('*')
      .where(['video_id = ?', oThis.videoId])
      .fire();

    if (queryRsp.length === 0) {
      return;
    }

    const tagIdsArray = [];
    for (let index = 0; index < queryRsp.length; index++) {
      tagIdsArray.push(queryRsp[index].tag_id);
    }

    if (tagIdsArray.length === 0) {
      return;
    }

    return new DecrementWeightsAndRemoveVideoTags({ tagIds: tagIdsArray, videoId: oThis.videoId }).perform();
  }

  /**
   * Filter tags.
   *
   * @sets oThis.text, oThis.tagIds
   *
   * @returns {Promise<void>}
   * @private
   */
  async _filterTags() {
    const oThis = this;

    // Filter out tags from video description.
    const filterTagsResp = await new FilterTags(oThis.videoDescription).perform(),
      videoDescriptionTagsData = filterTagsResp.data;

    oThis.text = videoDescriptionTagsData.text;
    oThis.tagIds = videoDescriptionTagsData.tagIds;
  }

  /**
   * Filter urls.
   *
   * @sets oThis.urlIds
   *
   * @returns {Promise<void>}
   * @private
   */
  async _filterUrls() {
    const oThis = this;

    // Filter out urls from video description.
    const filterUrlsResp = await new FilterUrls(oThis.videoDescription).perform(),
      videoDescriptionUrlsData = filterUrlsResp.data;

    oThis.urlIds = videoDescriptionUrlsData.urlIds;
  }

  /**
   * Increment weights of new tags and add video tags.
   *
   * @returns {Promise<*>}
   * @private
   */
  async _incrementWeightsAndAddVideoTags() {
    const oThis = this;

    if (oThis.isUserCreator) {
      return new IncrementWeightsAndAddVideoTags({ tagIds: oThis.tagIds, videoId: oThis.videoId }).perform();
    }
  }

  /**
   * Update video description.
   *
   * @sets oThis.textId
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateVideoDescription() {
    const oThis = this;

    // If textId already exists, we need to update the text model.
    if (oThis.textId) {
      const updateParams = {
        id: oThis.textId,
        tagIds: oThis.tagIds,
        linkIds: oThis.urlIds,
        text: oThis.text
      };

      return new TextModel().updateById(updateParams);
    }

    const insertParams = {
      text: oThis.text,
      linkIds: oThis.urlIds,
      kind: textConstants.videoDescriptionKind
    };

    if (oThis.isUserCreator) {
      insertParams.tagIds = oThis.tagIds;
    }

    // Create new entry in texts table.
    const textRow = await new TextModel().insertText(insertParams);

    oThis.textId = textRow.insertId;

    // Update video details table.
    await new VideoDetailsModel()
      .update({ description_id: oThis.textId })
      .where({ video_id: oThis.videoId })
      .fire();
  }

  /**
   * Flush cache.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _flushCache() {
    const oThis = this;

    const promisesArray = [VideoDetailsModel.flushCache({ userId: oThis.creatorUserId, videoId: oThis.videoId })];

    if (oThis.videoDetail.descriptionId) {
      promisesArray.push(TextModel.flushCache({ textIds: [oThis.videoDetail.descriptionId] }));
    }

    await Promise.all(promisesArray);
  }

  /**
   * Log admin activity.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _logAdminActivity() {
    const oThis = this;

    await new ActivityLogModel().insertAction({
      adminId: oThis.currentAdminId,
      actionOn: oThis.creatorUserId,
      action: adminActivityLogConstants.updateUserVideoDescription,
      extraData: JSON.stringify({ vid: oThis.videoId, descr: oThis.videoDescription })
    });
  }
}

module.exports = UpdateVideoDescription;
