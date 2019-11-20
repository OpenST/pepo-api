const rootPrefix = '../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  TextModel = require(rootPrefix + '/app/models/mysql/Text'),
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  UsersCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  EditDescriptionBase = require(rootPrefix + '/lib/editDescription/Base'),
  VideoDetailsModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  IncrementWeightsAndAddVideoTags = require(rootPrefix + '/lib/video/IncrementWeightsAndAddVideoTags'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  videoTagConstants = require(rootPrefix + '/lib/globalConstant/videoTag'),
  videoDetailsConstants = require(rootPrefix + '/lib/globalConstant/videoDetail');

/**
 * Class to edit video description.
 *
 * @class EditVideoDescription
 */
class EditVideoDescription extends EditDescriptionBase {
  /**
   * Constructor to edit video description.
   *
   * @param {object} params
   * @param {array} params.videoDescription: Video description.
   * @param {array} params.videoId: Video id to edited.
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);
  }

  /**
   * Fetch the video details and the creator user id and performs validations on the video status.
   *
   * @sets oThis.videoDetails, oThis.creatorUserId, oThis.texId
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchDetails() {
    const oThis = this;

    const videoDetailsCacheResponse = await new VideoDetailsByVideoIdsCache({ videoIds: [oThis.videoId] }).fetch();

    if (videoDetailsCacheResponse.isFailure()) {
      return Promise.reject(videoDetailsCacheResponse);
    }

    oThis.videoDetail = videoDetailsCacheResponse.data[oThis.videoId];
    oThis.creatorUserId = oThis.videoDetail.creatorUserId;
    oThis.texId = oThis.videoDetail.descriptionId || null;

    if (!oThis.creatorUserId || oThis.videoDetail.status === videoDetailsConstants.deletedStatus) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'l_ed_v_1',
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
   * Get video tag kind.
   *
   * @returns {string}
   * @private
   */
  _videoKind() {
    return videoTagConstants.postKind;
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
      return new IncrementWeightsAndAddVideoTags({
        tagIds: oThis.tagIds,
        videoId: oThis.videoId,
        kind: oThis._videoKind()
      }).perform();
    }
  }

  /**
   * Update video details model.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateDetailsModel(descriptionId, videoId) {
    const oThis = this;

    await new VideoDetailsModel()
      .update({ description_id: descriptionId })
      .where({ video_id: videoId })
      .fire();

    oThis.videoDetail.descriptionId = descriptionId;

    await VideoDetailsModel.flushCache({ videoId: videoId });
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

    if (oThis.texId) {
      textIdsToFlush.push(oThis.texId);
    }

    if (textIdsToFlush.length > 0) {
      promisesArray.push(TextModel.flushCache({ ids: textIdsToFlush }));
    }

    await Promise.all(promisesArray);
  }
}

module.exports = EditVideoDescription;
