const rootPrefix = '../../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  DeleteReplyVideoLib = require(rootPrefix + '/lib/video/delete/ReplyVideos'),
  ReplyDetailsByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/ReplyDetailsByIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  replyDetailsConstants = require(rootPrefix + '/lib/globalConstant/replyDetail');

/**
 * Class to delete reply video.
 *
 * @class DeleteReplyVideo
 */
class DeleteReplyVideo extends ServiceBase {
  /**
   * Constructor to delete video.
   *
   * @param {object} params
   * @param {number} params.reply_details_id
   * @param {object} params.current_admin
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.replyDetailsId = params.reply_details_id;
    oThis.currentAdmin = params.current_admin;
    oThis.currentAdminId = Number(oThis.currentAdmin.id);

    oThis.creatorUserId = null;
  }

  /**
   * Async perform.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    await oThis._fetchReplyDetails();

    // Unknown video or already deleted.
    if (oThis.replyDetails.status === replyDetailsConstants.deletedStatus) {
      return responseHelper.paramValidationError({
        internal_error_identifier: 'a_s_a_r_d_1',
        api_error_identifier: 'invalid_api_params',
        params_error_identifiers: ['invalid_reply_detail_id'],
        debug_options: { replyDetailsId: oThis.replyDetailsId }
      });
    }

    await new DeleteReplyVideoLib({
      replyDetailsIds: [oThis.replyDetailsId],
      isUserAction: false,
      currentAdminId: oThis.currentAdminId,
      userId: oThis.replyDetails.creatorUserId
    }).perform();

    return responseHelper.successWithData({});
  }

  /**
   * Fetch reply details.
   *
   * @sets oThis.replyDetails
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchReplyDetails() {
    const oThis = this;

    const replyDetailsCacheResponse = await new ReplyDetailsByIdsCache({ ids: [oThis.replyDetailsId] }).fetch();
    if (replyDetailsCacheResponse.isFailure()) {
      return Promise.reject(replyDetailsCacheResponse);
    }

    if (!CommonValidators.validateNonEmptyObject(replyDetailsCacheResponse.data[oThis.replyDetailsId])) {
      return responseHelper.paramValidationError({
        internal_error_identifier: 'a_s_a_r_d_2',
        api_error_identifier: 'invalid_api_params',
        params_error_identifiers: ['invalid_reply_detail_id'],
        debug_options: { replyDetailsId: oThis.replyDetailsId }
      });
    }

    oThis.replyDetails = replyDetailsCacheResponse.data[oThis.replyDetailsId];
  }
}

module.exports = DeleteReplyVideo;
