const rootPrefix = '../..',
  EditLinkBase = require(rootPrefix + '/lib/editLink/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ReplyDetailsModel = require(rootPrefix + '/app/models/mysql/ReplyDetail'),
  ReplyDetailsByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/ReplyDetailsByIds'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  videoDetailsConstants = require(rootPrefix + '/lib/globalConstant/videoDetail');

/**
 * Class to update link of reply.
 *
 * @class EditReplyLink
 */
class EditReplyLink extends EditLinkBase {
  /**
   * Constructor to update link of reply.
   *
   * @param {object} params
   * @param {array} params.link: Link of reply by admin.
   * @param {number} [params.currentAdminId]: current admin.
   * @param {array} params.replyDetailId: Reply id to edited.
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
   * @sets oThis.replyDetail, oThis.existingLinkIds, oThis.creatorUserId, oThis.videoId
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

    if (!CommonValidators.validateNonEmptyObject(oThis.replyDetail)) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_el_r_1',
          api_error_identifier: 'entity_not_found',
          debug_options: `replyDetailId: ${oThis.replyDetailId}`
        })
      );
    }

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
   * Update link ids in reply details.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateLinkIdsInEntities(linkIds) {
    const oThis = this;

    await new ReplyDetailsModel()
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

    // NOTE - userId was not passed to the flush cache as we don't want to flush the user replies cache.
    await ReplyDetailsModel.flushCache({
      replyDetailId: oThis.replyDetail.id
    });
  }
}

module.exports = EditReplyLink;
