const rootPrefix = '../../../..',
  FilterTags = require(rootPrefix + '/lib/FilterOutTags'),
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  TextModel = require(rootPrefix + '/app/models/mysql/Text'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  VideoTagModel = require(rootPrefix + '/app/models/mysql/VideoTag'),
  UsersCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  VideoDetailsModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  ActivityLogModel = require(rootPrefix + '/app/models/mysql/AdminActivityLog'),
  TextsByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/TextsByIds'),
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
    oThis.existingTextId = null;
    oThis.existingLinkIds = [];

    oThis.user = null;
    oThis.isUserCreator = null;

    oThis.text = null;
    oThis.tagsIds = [];

    oThis.urlIds = null;
  }

  /**
   * Async perform.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchVideoDetails();

    let promiseArray = [oThis._fetchTextDetails(), oThis._fetchCreatorUser()];
    await Promise.all(promiseArray);

    promiseArray = [oThis._decrementVideoTagsWeightForExistingDescription(), oThis._filterTags()];
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
   * @sets oThis.videoDetails, oThis.creatorUserId, oThis.existingTextId
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
    oThis.existingTextId = oThis.videoDetail.descriptionId || null;

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
   * Fetch text details.
   *
   * @sets oThis.existingLinkIds
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchTextDetails() {
    const oThis = this;

    if (!oThis.existingTextId) {
      return;
    }

    const cacheRsp = await new TextsByIdCache({ ids: [oThis.existingTextId] }).fetch();
    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    const textData = cacheRsp.data[oThis.existingTextId];

    oThis.existingLinkIds = textData.linkIds || [];
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
   * @sets oThis.existingTextId
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateVideoDescription() {
    const oThis = this;

    let newTextId = null;

    if (CommonValidators.validateNonBlankString(oThis.text)) {
      // If textId already exists, we need to update the text model.
      if (oThis.existingTextId) {
        const updateParams = {
          id: oThis.existingTextId,
          tagIds: oThis.tagIds,
          linkIds: oThis.urlIds,
          text: oThis.text
        };

        return new TextModel().updateById(updateParams);
        // Return here so there is no update in video detail.
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

      newTextId = textRow.insertId;
    } else {
      if (oThis.existingTextId) {
        await new TextModel().deleteById({ id: oThis.existingTextId });
      }

      newTextId = null;
    }

    // Update video details table.
    await new VideoDetailsModel()
      .update({ description_id: newTextId })
      .where({ video_id: oThis.videoId })
      .fire();

    oThis.videoDetail.descriptionId = newTextId;
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

    const textIdsToFlush = [];
    if (oThis.videoDetail.descriptionId) {
      textIdsToFlush.push(oThis.videoDetail.descriptionId);
    }

    if (oThis.existingTextId) {
      textIdsToFlush.push(oThis.existingTextId);
    }

    if (textIdsToFlush.length > 0) {
      promisesArray.push(TextModel.flushCache({ textIds: textIdsToFlush }));
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
