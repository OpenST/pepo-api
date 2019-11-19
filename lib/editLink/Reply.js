const rootPrefix = '../..',
  EditLinkBase = require(rootPrefix + '/lib/editLink/Base'),
  ReplyDetailModel = require(rootPrefix + '/app/models/mysql/ReplyDetail'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  ReplyDetailsByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/ReplyDetailsByIds'),
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
   * @param {array} params.replyDetailId: Video id to edited.
   *
   * @augments EditLinkBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.replyDetailId = params.replyDetailId;
    oThis.videoId = null;

    oThis.replyDetail = null;
  }

  /**
   * Fetch creator user id.
   *
   * @sets oThis.videoDetails, oThis.creatorUserId
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchCreatorUserId() {
    const oThis = this;

    const replyDetailCacheResp = await new ReplyDetailsByIdsCache({ ids: [oThis.replyDetailId] }).fetch();

    if (replyDetailCacheResp.isFailure()) {
      logger.error('Error while fetching reply detail data for reply_detail_id:', oThis.replyDetailId);

      return Promise.reject(replyDetailCacheResp);
    }

    oThis.replyDetail = replyDetailCacheResp.data[oThis.replyDetailId];

    oThis.existingLinkIds = oThis.replyDetail.linkIds;
    oThis.creatorUserId = oThis.replyDetail.creatorUserId;
    oThis.videoId = oThis.replyDetail.entityId;

    if (!oThis.creatorUserId || oThis.replyDetail.status === videoDetailsConstants.deletedStatus) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_a_v_ul_fcui_1',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['invalid_video_id'],
          debug_options: { replyDetail: oThis.replyDetail }
        })
      );
    }
  }

  /**
   * Update video details
   *
   * @returns {Promise<void>}
   */
  async _updateLinkIdsInEntities(linkIds) {
    const oThis = this;

    await new ReplyDetailModel()
      .update({ link_ids: JSON.stringify(linkIds) })
      .where({ id: oThis.replyDetail.id })
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

    await ReplyDetailModel.flushCache({
      replyDetailId: oThis.replyDetail.id,
      entityIds: [oThis.replyDetail.entityId],
      entityKind: oThis.replyDetail.entityKind
    });
  }
}

module.exports = EditVideoLink;
