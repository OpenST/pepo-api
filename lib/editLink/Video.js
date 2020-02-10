const rootPrefix = '../..',
  EditLinkBase = require(rootPrefix + '/lib/editLink/Base'),
  VideoDetailModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  VideoDetailsByVideoIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoDetailsByVideoIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  videoDetailsConstants = require(rootPrefix + '/lib/globalConstant/videoDetail');

/**
 * Class to update link of video.
 *
 * @class EditVideoLink
 */
class EditVideoLink extends EditLinkBase {
  /**
   * Constructor to update link of video.
   *
   * @param {object} params
   * @param {array} params.link: Link of video by admin.
   * @param {number} [params.currentAdminId]: current admin.
   * @param {array} params.videoId: Video id to edited.
   *
   * @augments EditLinkBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.videoId = params.videoId;

    oThis.videoDetail = null;
  }

  /**
   * Fetch creator user id.
   *
   * @sets oThis.videoDetails, oThis.existingLinkIds, oThis.creatorUserId
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchCreatorUserId() {
    const oThis = this;

    const videoDetailsCacheResponse = await new VideoDetailsByVideoIdsCache({ videoIds: [oThis.videoId] }).fetch();
    if (videoDetailsCacheResponse.isFailure()) {
      return Promise.reject(videoDetailsCacheResponse);
    }

    oThis.videoDetail = videoDetailsCacheResponse.data[oThis.videoId];
    oThis.existingLinkIds = oThis.videoDetail.linkIds;
    oThis.creatorUserId = oThis.videoDetail.creatorUserId;

    if (!oThis.creatorUserId || oThis.videoDetail.status === videoDetailsConstants.deletedStatus) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_a_v_ul_fcui_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_video_id'],
          debug_options: { videoDetails: oThis.videoDetail }
        })
      );
    }
  }

  /**
   * Update video details.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateLinkIdsInEntities(linkIds) {
    const oThis = this;

    await new VideoDetailModel()
      .update({ link_ids: JSON.stringify(linkIds) })
      .where({ id: oThis.videoDetail.id })
      .fire();

    await oThis._flushCache();
  }

  /**
   * Flush cache.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _flushCache() {
    const oThis = this;

    await VideoDetailModel.flushCache({ userId: oThis.creatorUserId, videoId: oThis.videoId });
  }
}

module.exports = EditVideoLink;
